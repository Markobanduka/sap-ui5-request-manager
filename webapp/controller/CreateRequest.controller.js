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
        const oBundle = this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle();

        // Get form values
        const oCategory = this.byId("categorySelect");
        const oPriority = this.byId("prioritySelect");
        const oDesc = this.byId("descArea");

        if (!oCategory || !oPriority || !oDesc) {
          MessageBox.error("Please reload the page");
          return;
        }

        const sCategory = oCategory.getSelectedKey();
        const sPriority = oPriority.getSelectedKey();
        const sDesc = oDesc.getValue().trim();

        if (!sCategory || !sPriority || !sDesc) {
          MessageBox.warning(oBundle.getText("msgFillRequired"));
          return;
        }

        // Get or create model
        const oComponent = this.getOwnerComponent();
        const oRequestsModel = oComponent.getModel("requestsModel");

        if (!oRequestsModel) {
          oRequestsModel = new JSONModel({ requests: [] });
          oComponent.setModel(oRequestsModel, "requestsModel");
        }

        // Get current requests
        const aRequests = oRequestsModel.getProperty("/requests") || [];

        // Create new request
        const newRequest = {
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
        const that = this;
        setTimeout(function () {
          that.getOwnerComponent().getRouter().navTo("dashboard");
        }, 2000);
      },

      _sendCreationNotification: function (oRequest) {
        const EmailService = sap.ui.require(
          "ui5/requestmanager/service/EmailService"
        );
        if (EmailService && EmailService.isNotificationsEnabled()) {
          const sEmail = EmailService.getUserEmail();
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
        const oCategory = this.byId("categorySelect");
        const oPriority = this.byId("prioritySelect");
        const oDesc = this.byId("descArea");

        if (oCategory) oCategory.setSelectedKey("");
        if (oPriority) oPriority.setSelectedKey("");
        if (oDesc) oDesc.setValue("");
      },
    });
  }
);
