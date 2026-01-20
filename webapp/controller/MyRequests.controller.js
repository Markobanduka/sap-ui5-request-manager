sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function(Controller, Filter, FilterOperator, MessageToast, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("ui5.requestmanagerapp.controller.MyRequests", {
        onInit: function() {
            console.log("MyRequests controller initialized");
            
            // Create view model for filters
            var oViewModel = new JSONModel({
                statusFilter: "",
                searchFilter: ""
            });
            this.getView().setModel(oViewModel, "viewModel");
            
            // Initialize combined filters
            this._applyCombinedFilters();
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        },

        onSearch: function(oEvent) {
            var sQuery = oEvent.getSource().getValue() || "";
            sQuery = sQuery.trim();
            
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/searchFilter", sQuery);
            
            this._applyCombinedFilters();
        },

        onStatusFilterChange: function(oEvent) {
            var sStatus = oEvent.getSource().getSelectedKey();
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/statusFilter", sStatus);
            
            this._applyCombinedFilters();
        },

        _applyCombinedFilters: function() {
            var oTable = this.byId("requestsTable");
            if (!oTable) return;
            
            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;
            
            var oViewModel = this.getView().getModel("viewModel");
            var sStatusFilter = oViewModel.getProperty("/statusFilter");
            var sSearchFilter = oViewModel.getProperty("/searchFilter");
            
            var aFilters = [];
            
            // Apply status filter
            if (sStatusFilter) {
                aFilters.push(new Filter("status", FilterOperator.EQ, sStatusFilter));
            }
            
            // Apply search filter
            if (sSearchFilter) {
                var aSearchFilters = [
                    new Filter("id", FilterOperator.Contains, sSearchFilter),
                    new Filter("category", FilterOperator.Contains, sSearchFilter),
                    new Filter("description", FilterOperator.Contains, sSearchFilter),
                    new Filter("priority", FilterOperator.Contains, sSearchFilter)
                ];
                aFilters.push(new Filter({ 
                    filters: aSearchFilters, 
                    and: false  // OR between search fields
                }));
            }
            
            // Apply combined filters (AND between status and search)
            if (aFilters.length > 0) {
                oBinding.filter(new Filter({ 
                    filters: aFilters, 
                    and: true 
                }));
            } else {
                oBinding.filter([]);
            }
            
            // Update item count display
            this._updateItemCount();
        },

        _updateItemCount: function() {
            var oTable = this.byId("requestsTable");
            if (!oTable) return;
            
            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;
            
            // Get filtered length
            var aContexts = oBinding.getCurrentContexts();
            var iFilteredCount = aContexts ? aContexts.length : 0;
            
            // Get total length
            var oModel = this.getOwnerComponent().getModel("requestsModel");
            var aAllRequests = oModel.getProperty("/requests") || [];
            var iTotalCount = aAllRequests.length;
            
            // Update label if needed (you might want to bind this to a model)
            var oLabel = this.byId("itemCountLabel");
            if (oLabel) {
                if (iFilteredCount === iTotalCount) {
                    oLabel.setText(this.formatItemCount(aAllRequests));
                } else {
                    oLabel.setText(iFilteredCount + " of " + iTotalCount + " requests");
                }
            }
        },

        onSelectionChange: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext("requestsModel");
                var oRequest = oContext.getObject();
                
                // Navigate to details view
                this.getOwnerComponent().getRouter().navTo("details", {
                    requestId: oRequest.id
                });
            }
        },

        onExport: function() {
            var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var oModel = this.getOwnerComponent().getModel("requestsModel");
            var aRequests = oModel.getProperty("/requests") || [];
            
            if (aRequests.length === 0) {
                MessageToast.show(oBundle.getText("msgExportEmpty"));
                return;
            }
            
            // Create CSV content
            var sCsv = this._convertToCSV(aRequests);
            
            // Create download link
            var sFileName = oBundle.getText("exportFileName", [new Date().toISOString().slice(0, 10)]);
            this._downloadCSV(sCsv, sFileName);
            
            MessageToast.show(oBundle.getText("msgExportSuccess", [aRequests.length]));
        },

        _convertToCSV: function(aRequests) {
            // CSV headers
            var aHeaders = ["ID", "Category", "Priority", "Status", "Created On", "Description"];
            var sCsv = aHeaders.join(",") + "\n";
            
            // Add data rows
            aRequests.forEach(function(oRequest) {
                var aRow = [
                    '"' + (oRequest.id || "") + '"',
                    '"' + (oRequest.category || "") + '"',
                    '"' + (oRequest.priority || "") + '"',
                    '"' + (oRequest.status || "") + '"',
                    '"' + (oRequest.createdOn || "") + '"',
                    '"' + (oRequest.description || "").replace(/"/g, '""') + '"'
                ];
                sCsv += aRow.join(",") + "\n";
            });
            
            return sCsv;
        },

        _downloadCSV: function(sCsv, sFileName) {
            var sBlob = new Blob(["\ufeff", sCsv], { type: "text/csv;charset=utf-8;" });
            
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(sBlob, sFileName);
            } else {
                var sLink = document.createElement("a");
                if (sLink.download !== undefined) {
                    var sUrl = URL.createObjectURL(sBlob);
                    sLink.setAttribute("href", sUrl);
                    sLink.setAttribute("download", sFileName);
                    sLink.style.visibility = "hidden";
                    document.body.appendChild(sLink);
                    sLink.click();
                    document.body.removeChild(sLink);
                }
            }
        },

        // Quick Edit action
        onQuickEdit: function(oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("requestsModel");
            var oRequest = oContext.getObject();
            
            // Navigate to details
            this.getOwnerComponent().getRouter().navTo("details", {
                requestId: oRequest.id
            });
        },

        // Quick Delete action
        onQuickDelete: function(oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("requestsModel");
            var oRequest = oContext.getObject();
            var that = this;
            
            var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            
            MessageBox.confirm(oBundle.getText("msgConfirmDelete"), {
                title: oBundle.getText("titleConfirm"),
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._deleteRequestFromContext(oContext);
                    }
                }
            });
        },

        _deleteRequestFromContext: function(oContext) {
            var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var oModel = oContext.getModel();
            var aRequests = oModel.getProperty("/requests");
            var sPath = oContext.getPath();
            var nIndex = parseInt(sPath.split("/").pop());
            
            // Remove from array
            aRequests.splice(nIndex, 1);
            oModel.setProperty("/requests", aRequests);
            
            MessageToast.show(oBundle.getText("msgRequestDeleted"));
            
            // Update filters after deletion
            this._applyCombinedFilters();
        },

        // Formatter functions
        formatItemCount: function(aRequests) {
            if (!aRequests || !aRequests.length) {
                return "No requests";
            }
            return aRequests.length + " request" + (aRequests.length !== 1 ? "s" : "");
        },

        formatPriorityState: function(sPriority) {
            if (sPriority === "Critical") return "Error";
            if (sPriority === "High") return "Error";
            if (sPriority === "Medium") return "Warning";
            if (sPriority === "Low") return "Success";
            return "None";
        },

        formatPriorityIcon: function(sPriority) {
            if (sPriority === "Critical") return "sap-icon://alert";
            if (sPriority === "High") return "sap-icon://error";
            if (sPriority === "Medium") return "sap-icon://warning";
            if (sPriority === "Low") return "sap-icon://information";
            return "";
        },

        formatStatusState: function(sStatus) {
            if (sStatus === "Open") return "Warning";
            if (sStatus === "In Progress") return "Information";
            if (sStatus === "Closed") return "Success";
            return "None";
        },

        onAfterRendering: function() {
            console.log("MyRequests view rendered");
            this._updateItemCount();
        },
        
        // Debug function to check filters
        debugFilters: function() {
            var oViewModel = this.getView().getModel("viewModel");
            console.log("Current filters:", {
                statusFilter: oViewModel.getProperty("/statusFilter"),
                searchFilter: oViewModel.getProperty("/searchFilter")
            });
            
            var oTable = this.byId("requestsTable");
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    var aFilters = oBinding.getFilters();
                    console.log("Applied filters:", aFilters);
                    
                    var aContexts = oBinding.getCurrentContexts();
                    console.log("Filtered items:", aContexts ? aContexts.length : 0);
                }
            }
        }
    });
});