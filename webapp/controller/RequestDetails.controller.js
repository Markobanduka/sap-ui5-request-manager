sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function(Controller, MessageBox, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("ui5.requestmanager.controller.RequestDetails", {
        onInit: function() {
            console.log("RequestDetails controller initialized");
            
            // Create view model for edit mode
            const oViewModel = new JSONModel({
                editMode: false,
                originalData: null
            });
            this.getView().setModel(oViewModel, "viewModel");
            
            // Get router and attach route matched
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("details").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            const sRequestId = oArgs.requestId;
            
            console.log("Loading details for request:", sRequestId);
            
            // Find the request in the model
            const oModel = this.getOwnerComponent().getModel("requestsModel");
            const aRequests = oModel.getProperty("/requests") || [];
            const oRequest = aRequests.find(function(req) {
                return req.id === sRequestId;
            });
            
            if (oRequest) {
                // Bind the request to the view
                this.getView().bindElement({
                    path: "requestsModel>/requests/" + aRequests.indexOf(oRequest),
                    model: "requestsModel"
                });
                
                // Store original data for cancel
                const oViewModel = this.getView().getModel("viewModel");
                oViewModel.setProperty("/originalData", JSON.parse(JSON.stringify(oRequest)));
            } else {
                MessageToast.show("Request not found");
                this.onNavBack();
            }
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("myrequests");
        },

        onEdit: function() {
            const oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/editMode", true);
        },

        onSave: function() {
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            const oViewModel = this.getView().getModel("viewModel");
            const oRequest = this.getView().getBindingContext("requestsModel").getObject();
            
            // Simple validation
            if (!oRequest.category || !oRequest.priority || !oRequest.description) {
                MessageBox.warning(oBundle.getText("msgFillRequired"));
                return;
            }
            
            // Update the model (binding automatically updates)
            oViewModel.setProperty("/editMode", false);
            oViewModel.setProperty("/originalData", null);
            
            MessageToast.show(oBundle.getText("msgRequestUpdated"));
            
            // Optional: Force model update
            const oModel = this.getOwnerComponent().getModel("requestsModel");
            oModel.updateBindings();
        },

        onCancelEdit: function() {
            const oViewModel = this.getView().getModel("viewModel");
            const oOriginalData = oViewModel.getProperty("/originalData");
            
            if (oOriginalData) {
                // Restore original data
                const oRequestContext = this.getView().getBindingContext("requestsModel");
                const oModel = oRequestContext.getModel();
                const sPath = oRequestContext.getPath();
                
                oModel.setProperty(sPath, oOriginalData);
            }
            
            oViewModel.setProperty("/editMode", false);
            oViewModel.setProperty("/originalData", null);
            // Get old status before update
            const oOldRequest = this.getView().getBindingContext("requestsModel").getObject();
            const sOldStatus = oOldRequest.status;
            
            // Update model
            oViewModel.setProperty("/editMode", false);
            
            // Send status change notification
            this._sendStatusNotification(oRequest, sOldStatus);
            
            MessageToast.show(oBundle.getText("msgRequestUpdated"));

        },

        onDelete: function() {
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            const that = this;
            
            MessageBox.confirm(oBundle.getText("msgConfirmDelete"), {
                title: oBundle.getText("titleConfirm"),
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._deleteRequest();
                    }
                }
            });
        },

        _sendStatusNotification: function(oRequest, sOldStatus) {
            if (sOldStatus !== oRequest.status) {
                const EmailService = sap.ui.require("ui5/requestmanagerapp/service/EmailService");
                if (EmailService && EmailService.isNotificationsEnabled()) {
                    const sEmail = EmailService.getUserEmail();
                    EmailService.notifyStatusUpdate(oRequest, sOldStatus, sEmail)
                        .then(function(response) {
                            console.log("Status notification sent:", response);
                        })
                        .catch(function(error) {
                            console.error("Failed to send notification:", error);
                        });
                }
            }
        },
        _deleteRequest: function() {
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            const oRequestContext = this.getView().getBindingContext("requestsModel");
            
            if (oRequestContext) {
                const oModel = oRequestContext.getModel();
                const aRequests = oModel.getProperty("/requests");
                const sPath = oRequestContext.getPath();
                const nIndex = parseInt(sPath.split("/").pop());
                
                // Remove from array
                aRequests.splice(nIndex, 1);
                oModel.setProperty("/requests", aRequests);
                
                MessageToast.show(oBundle.getText("msgRequestDeleted"));
                this.onNavBack();
            }
        },

        formatStatusState: function(sStatus) {
            if (sStatus === "Open") return "Warning";
            if (sStatus === "In Progress") return "Information";
            if (sStatus === "Closed") return "Success";
            return "None";
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