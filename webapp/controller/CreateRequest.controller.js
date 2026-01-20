sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
  ],
  function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("ui5.requestmanager.controller.CreateRequest", {
      onInit: function () {
        console.log("CreateRequest controller initialized");
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("dashboard");
      },

      onCancel: function () {
        this._resetForm();
        this.getOwnerComponent().getRouter().navTo("dashboard");
      },

      onSubmit: function () {
        var oBundle = this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle();

        // Get form values
        var oCategory = this.byId("categorySelect");
        var oPriority = this.byId("prioritySelect");
        var oDesc = this.byId("descArea");

        if (!oCategory || !oPriority || !oDesc) {
          MessageBox.error("Please reload the page");
          return;
        }

        var sCategory = oCategory.getSelectedKey();
        var sPriority = oPriority.getSelectedKey();
        var sDesc = oDesc.getValue().trim();

        if (!sCategory || !sPriority || !sDesc) {
          MessageBox.warning(oBundle.getText("msgFillRequired"));
          return;
        }

        // Get or create model
        var oComponent = this.getOwnerComponent();
        var oRequestsModel = oComponent.getModel("requestsModel");

        if (!oRequestsModel) {
          oRequestsModel = new JSONModel({ requests: [] });
          oComponent.setModel(oRequestsModel, "requestsModel");
        }

        // Get current requests
        var aRequests = oRequestsModel.getProperty("/requests") || [];

        // Create new request
        var newRequest = {
          id: "REQ-" + Date.now(),
          category: sCategory,
          priority: sPriority,
          description: sDesc,
          status: "Open",
          createdOn: new Date().toISOString().split("T")[0],
        };

        console.log("Adding request:", newRequest);

        // Add to beginning of array
        aRequests.unshift(newRequest);

        // Update model
        oRequestsModel.setProperty("/requests", aRequests);

        // Show success message with longer duration
        MessageToast.show(oBundle.getText("msgRequestCreated"), {
          duration: 5000,
          width: "25em",
        });

        // Send email notification if enabled
        this._sendCreationNotification(newRequest);

        // Reset form immediately (optional)
        this._resetForm();

        // Navigate back to dashboard after 2 seconds
        var that = this;
        setTimeout(function () {
          that.getOwnerComponent().getRouter().navTo("dashboard");
        }, 2000);
      },

      _sendCreationNotification: function (oRequest) {
        var EmailService = sap.ui.require(
          "ui5/requestmanagerapp/service/EmailService"
        );
        if (EmailService && EmailService.isNotificationsEnabled()) {
          var sEmail = EmailService.getUserEmail();
          EmailService.notifyRequestCreated(oRequest, sEmail)
            .then(function (response) {
              console.log("Creation notification sent:", response);
            })
            .catch(function (error) {
              console.error("Failed to send notification:", error);
            });
        }
      },

      _resetForm: function () {
        var oCategory = this.byId("categorySelect");
        var oPriority = this.byId("prioritySelect");
        var oDesc = this.byId("descArea");

        if (oCategory) oCategory.setSelectedKey("");
        if (oPriority) oPriority.setSelectedKey("");
        if (oDesc) oDesc.setValue("");
      },
    });
  }
);
