sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "ui5/requestmanager/formatter/formatter"
], function(Controller, Filter, FilterOperator, MessageToast, JSONModel, MessageBox, formatter) {
    "use strict";

    return Controller.extend("ui5.requestmanager.controller.MyRequests", {
        onInit: function() {
            console.log("MyRequests controller initialized");
            
            // Create view model for filters
            const oViewModel = new JSONModel({
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
            const sQuery = oEvent.getSource().getValue() || "";
            sQuery = sQuery.trim();
            
            const oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/searchFilter", sQuery);
            
            this._applyCombinedFilters();
        },

        onStatusFilterChange: function(oEvent) {
            const sStatus = oEvent.getSource().getSelectedKey();
            const oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/statusFilter", sStatus);
            
            this._applyCombinedFilters();
        },

        _applyCombinedFilters: function() {
            const oTable = this.byId("requestsTable");
            if (!oTable) return;
            
            const oBinding = oTable.getBinding("items");
            if (!oBinding) return;
            
            const oViewModel = this.getView().getModel("viewModel");
            const sStatusFilter = oViewModel.getProperty("/statusFilter");
            const sSearchFilter = oViewModel.getProperty("/searchFilter");
            
            const aFilters = [];
            
            // Apply status filter
            if (sStatusFilter) {
                aFilters.push(new Filter("status", FilterOperator.EQ, sStatusFilter));
            }
            
            // Apply search filter
            if (sSearchFilter) {
                const aSearchFilters = [
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
            const oTable = this.byId("requestsTable");
            if (!oTable) return;
            
            const oBinding = oTable.getBinding("items");
            if (!oBinding) return;
            
            // Get filtered length
            const aContexts = oBinding.getCurrentContexts();
            const iFilteredCount = aContexts ? aContexts.length : 0;
            
            // Get total length
            const oModel = this.getOwnerComponent().getModel("requestsModel");
            const aAllRequests = oModel.getProperty("/requests") || [];
            const iTotalCount = aAllRequests.length;
            
            // Update label if needed (you might want to bind this to a model)
            const oLabel = this.byId("itemCountLabel");
            if (oLabel) {
                if (iFilteredCount === iTotalCount) {
                    oLabel.setText(this.formatItemCount(aAllRequests));
                } else {
                    oLabel.setText(iFilteredCount + " of " + iTotalCount + " requests");
                }
            }
        },

        onSelectionChange: function(oEvent) {
            const oSelectedItem = oEvent.getParameter("listItem");
            if (oSelectedItem) {
                const oContext = oSelectedItem.getBindingContext("requestsModel");
                const oRequest = oContext.getObject();
                
                // Navigate to details view
                this.getOwnerComponent().getRouter().navTo("details", {
                    requestId: oRequest.id
                });
            }
        },

        onExport: function() {
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            const oModel = this.getOwnerComponent().getModel("requestsModel");
            const aRequests = oModel.getProperty("/requests") || [];
            
            if (aRequests.length === 0) {
                MessageToast.show(oBundle.getText("msgExportEmpty"));
                return;
            }
            
            // Create CSV content
            const sCsv = this._convertToCSV(aRequests);
            
            // Create download link
            const sFileName = oBundle.getText("exportFileName", [new Date().toISOString().slice(0, 10)]);
            this._downloadCSV(sCsv, sFileName);
            
            MessageToast.show(oBundle.getText("msgExportSuccess", [aRequests.length]));
        },

        _convertToCSV: function(aRequests) {
            // CSV headers
            const aHeaders = ["ID", "Category", "Priority", "Status", "Created On", "Description"];
            const sCsv = aHeaders.join(",") + "\n";
            
            // Add data rows
            aRequests.forEach(function(oRequest) {
                const aRow = [
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
            const sBlob = new Blob(["\ufeff", sCsv], { type: "text/csv;charset=utf-8;" });
            
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(sBlob, sFileName);
            } else {
                const sLink = document.createElement("a");
                if (sLink.download !== undefined) {
                    const sUrl = URL.createObjectURL(sBlob);
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
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext("requestsModel");
            const oRequest = oContext.getObject();
            
            // Navigate to details
            this.getOwnerComponent().getRouter().navTo("details", {
                requestId: oRequest.id
            });
        },

        // Quick Delete action
        onQuickDelete: function(oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext("requestsModel");
            const oRequest = oContext.getObject();
            const that = this;
            
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            
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
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            const oModel = oContext.getModel();
            const aRequests = oModel.getProperty("/requests");
            const sPath = oContext.getPath();
            const nIndex = parseInt(sPath.split("/").pop());
            
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

        formatter:formatter,


        onAfterRendering: function() {
            console.log("MyRequests view rendered");
            this._updateItemCount();
        },
        
        // Debug function to check filters
        debugFilters: function() {
            const oViewModel = this.getView().getModel("viewModel");
            console.log("Current filters:", {
                statusFilter: oViewModel.getProperty("/statusFilter"),
                searchFilter: oViewModel.getProperty("/searchFilter")
            });
            
            const oTable = this.byId("requestsTable");
            if (oTable) {
                const oBinding = oTable.getBinding("items");
                if (oBinding) {
                    const aFilters = oBinding.getFilters();
                    console.log("Applied filters:", aFilters);
                    
                    const aContexts = oBinding.getCurrentContexts();
                    console.log("Filtered items:", aContexts ? aContexts.length : 0);
                }
            }
        }
    });
});