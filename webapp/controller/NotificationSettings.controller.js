sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("ui5.requestmanager.controller.NotificationSettings", {
        onInit: function() {
            console.log("NotificationSettings controller initialized");
            
            // Load settings
            this._loadSettings();
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        },

        _loadSettings: function() {
            var EmailService = sap.ui.require("ui5/requestmanagerapp/service/EmailService");
            var oSettings = {
                emailEnabled: EmailService ? EmailService.isNotificationsEnabled() : false,
                emailAddress: EmailService ? EmailService.getUserEmail() : "",
                emailFrequency: "immediate",
                notifyNewRequest: true,
                notifyStatusChange: true,
                notifyAssignment: true
            };
            
            var oModel = new JSONModel(oSettings);
            this.getView().setModel(oModel, "settingsModel");
        },

        onEmailToggle: function(oEvent) {
            var bEnabled = oEvent.getParameter("state");
            var EmailService = sap.ui.require("ui5/requestmanagerapp/service/EmailService");
            if (EmailService) {
                EmailService.setNotificationsEnabled(bEnabled);
                MessageToast.show("Email notifications " + (bEnabled ? "enabled" : "disabled"));
            }
        },

        onSave: function() {
            var oModel = this.getView().getModel("settingsModel");
            var oSettings = oModel.getData();
            
            // Save to EmailService
            var EmailService = sap.ui.require("ui5/requestmanagerapp/service/EmailService");
            if (EmailService) {
                EmailService.setUserEmail(oSettings.emailAddress);
                EmailService.setNotificationsEnabled(oSettings.emailEnabled);
                
                // Save other settings to localStorage
                localStorage.setItem("emailFrequency", oSettings.emailFrequency);
                localStorage.setItem("notifyNewRequest", oSettings.notifyNewRequest);
                localStorage.setItem("notifyStatusChange", oSettings.notifyStatusChange);
                localStorage.setItem("notifyAssignment", oSettings.notifyAssignment);
            }
            
            MessageToast.show("Notification settings saved successfully");
            this.onNavBack();
        },

        onCancel: function() {
            this.onNavBack();
        },

        onSendTestNotification: function() {
            var oModel = this.getView().getModel("settingsModel");
            var sEmail = oModel.getProperty("/emailAddress");
            
            if (!sEmail || !sEmail.includes("@")) {
                MessageBox.warning("Please enter a valid email address");
                return;
            }
            
            var EmailService = sap.ui.require("ui5/requestmanagerapp/service/EmailService");
            if (EmailService) {
                var oTestRequest = {
                    id: "TEST-" + Date.now(),
                    category: "Test",
                    priority: "Medium",
                    status: "Open",
                    createdOn: new Date().toISOString().split('T')[0],
                    description: "This is a test notification from IT Request Manager"
                };
                
                EmailService.sendNotification(
                    sEmail,
                    "Test Notification - IT Request Manager",
                    "This is a test email notification.\n\nIf you received this, your notification settings are working correctly!\n\nYou can now receive updates about your IT service requests."
                ).then(function(response) {
                    MessageBox.success("Test notification sent successfully!\n\nCheck your email: " + sEmail);
                }).catch(function(error) {
                    MessageBox.error("Failed to send test notification: " + error.message);
                });
            }
        }
    });
});