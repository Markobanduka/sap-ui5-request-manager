sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function(Controller, MessageBox) {
    "use strict";

    return Controller.extend("ui5.requestmanager.controller.Dashboard", {
        onInit: function() {
            console.log("Dashboard controller initialized");
        },

        onNavigateToCreate: function() {
            this.getOwnerComponent().getRouter().navTo("create");
        },

        onNavigateToMyRequests: function() {
            this.getOwnerComponent().getRouter().navTo("myrequests");
        },

        onHelp: function() {
            var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            MessageBox.information(oBundle.getText("helpMessage"));
        },
        onNavigateToStats: function() {
            this.getOwnerComponent().getRouter().navTo("stats");
        },
        onNavigateToNotifications: function() {
            this.getOwnerComponent().getRouter().navTo("notifications");
        }
    });
});