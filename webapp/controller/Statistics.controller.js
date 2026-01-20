sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ui5.requestmanagerapp.controller.Statistics", {
        onInit: function() {
            console.log("Statistics controller initialized");
            
            // Create stats model
            this._createStatsModel();
            
            // Load initial data
            this._loadStatistics();
            
            // Refresh every 30 seconds
            this._refreshInterval = setInterval(this._loadStatistics.bind(this), 30000);
        },

        onExit: function() {
            // Clear refresh interval
            if (this._refreshInterval) {
                clearInterval(this._refreshInterval);
            }
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        },

        onRefresh: function() {
            MessageToast.show("Refreshing statistics...");
            this._loadStatistics();
        },

        onExportStats: function() {
            this._exportStatistics();
        },

        _createStatsModel: function() {
            var oStatsModel = new JSONModel({
                totalRequests: 0,
                openRequests: 0,
                inProgress: 0,
                closedRequests: 0,
                criticalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                criticalPercentage: 0,
                highPercentage: 0,
                mediumPercentage: 0,
                lowPercentage: 0,
                categoryData: [],
                recentActivity: []
            });
            this.getView().setModel(oStatsModel, "statsModel");
        },

        _loadStatistics: function() {
            var oRequestsModel = this.getOwnerComponent().getModel("requestsModel");
            var aRequests = oRequestsModel.getProperty("/requests") || [];
            
            // Calculate statistics
            var stats = this._calculateStatistics(aRequests);
            
            // Update model
            var oStatsModel = this.getView().getModel("statsModel");
            oStatsModel.setData(stats);
            
            console.log("Statistics updated:", stats);
        },

        _calculateStatistics: function(aRequests) {
            var stats = {
                totalRequests: aRequests.length,
                openRequests: 0,
                inProgress: 0,
                closedRequests: 0,
                criticalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                criticalPercentage: 0,
                highPercentage: 0,
                mediumPercentage: 0,
                lowPercentage: 0,
                categoryData: [],
                recentActivity: []
            };
            
            // Status counts
            var statusCounts = { Open: 0, "In Progress": 0, Closed: 0 };
            var categoryCounts = {};
            var priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
            
            aRequests.forEach(function(request) {
                // Status counts
                if (request.status === "Open") stats.openRequests++;
                if (request.status === "In Progress") stats.inProgress++;
                if (request.status === "Closed") stats.closedRequests++;
                
                statusCounts[request.status] = (statusCounts[request.status] || 0) + 1;
                
                // Category counts
                categoryCounts[request.category] = (categoryCounts[request.category] || 0) + 1;
                
                // Priority counts
                if (priorityCounts.hasOwnProperty(request.priority)) {
                    priorityCounts[request.priority]++;
                }
            });
            
            // Update priority counts
            stats.criticalCount = priorityCounts.Critical;
            stats.highCount = priorityCounts.High;
            stats.mediumCount = priorityCounts.Medium;
            stats.lowCount = priorityCounts.Low;
            
            // Calculate percentages
            if (stats.totalRequests > 0) {
                stats.criticalPercentage = Math.round((priorityCounts.Critical / stats.totalRequests) * 100);
                stats.highPercentage = Math.round((priorityCounts.High / stats.totalRequests) * 100);
                stats.mediumPercentage = Math.round((priorityCounts.Medium / stats.totalRequests) * 100);
                stats.lowPercentage = Math.round((priorityCounts.Low / stats.totalRequests) * 100);
            }
            
            // Prepare category data with percentages
            stats.categoryData = Object.keys(categoryCounts).map(function(category) {
                var count = categoryCounts[category];
                var percentage = stats.totalRequests > 0 ? Math.round((count / stats.totalRequests) * 100) : 0;
                return {
                    category: category,
                    count: count,
                    percentage: percentage
                };
            });
            
            // Recent activity (last 5 requests)
            stats.recentActivity = aRequests.slice(0, 5).map(function(request) {
                return {
                    title: request.id,
                    description: request.description.substring(0, 50) + (request.description.length > 50 ? "..." : ""),
                    category: request.category,
                    status: request.status,
                    statusState: request.status === "Open" ? "Warning" : 
                                request.status === "In Progress" ? "Information" : "Success",
                    priority: request.priority,
                    time: this._formatTimeAgo(request.createdOn)
                };
            }.bind(this));
            
            return stats;
        },

        _formatTimeAgo: function(dateString) {
            try {
                var createdDate = new Date(dateString);
                if (isNaN(createdDate.getTime())) {
                    return dateString;
                }
                
                var now = new Date();
                var diffMs = now - createdDate;
                var diffDays = Math.floor(diffMs / 86400000);
                var diffHrs = Math.floor((diffMs % 86400000) / 3600000);
                var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
                
                if (diffDays > 0) return diffDays + " days ago";
                if (diffHrs > 0) return diffHrs + " hours ago";
                return diffMins > 0 ? diffMins + " minutes ago" : "Just now";
            } catch (e) {
                return dateString;
            }
        },

        _exportStatistics: function() {
            var oStatsModel = this.getView().getModel("statsModel");
            var stats = oStatsModel.getData();
            
            var csvContent = "IT Request Manager Statistics\n";
            csvContent += "Generated: " + new Date().toLocaleString() + "\n\n";
            csvContent += "Summary\n";
            csvContent += "Total Requests," + stats.totalRequests + "\n";
            csvContent += "Open Requests," + stats.openRequests + "\n";
            csvContent += "In Progress," + stats.inProgress + "\n";
            csvContent += "Closed Requests," + stats.closedRequests + "\n\n";
            csvContent += "Priority Distribution\n";
            csvContent += "Critical," + stats.criticalCount + " (" + stats.criticalPercentage + "%)\n";
            csvContent += "High," + stats.highCount + " (" + stats.highPercentage + "%)\n";
            csvContent += "Medium," + stats.mediumCount + " (" + stats.mediumPercentage + "%)\n";
            csvContent += "Low," + stats.lowCount + " (" + stats.lowPercentage + "%)\n\n";
            csvContent += "Category Distribution\n";
            stats.categoryData.forEach(function(item) {
                csvContent += item.category + "," + item.count + " (" + item.percentage + "%)\n";
            });
            
            var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            var link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "it-request-stats-" + new Date().toISOString().slice(0,10) + ".csv";
            link.click();
            
            MessageToast.show("Statistics exported successfully");
        },

        // Formatter functions
        formatPercentage: function(iCount) {
            var oStatsModel = this.getView().getModel("statsModel");
            var iTotal = oStatsModel.getProperty("/totalRequests");
            if (iTotal === 0) return 0;
            return Math.round((iCount / iTotal) * 100);
        },

        formatCategoryState: function(sCategory) {
            // Assign different colors to categories
            var colors = {
                "Hardware": "Error",
                "Software": "Information",
                "Access": "Warning",
                "Network": "Success"
            };
            return colors[sCategory] || "None";
        },

        formatPriorityState: function(sPriority) {
            if (sPriority === "Critical") return "Error";
            if (sPriority === "High") return "Error";
            if (sPriority === "Medium") return "Warning";
            if (sPriority === "Low") return "Success";
            return "None";
        }
    });
});