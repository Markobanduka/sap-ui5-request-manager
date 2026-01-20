sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";

    return Controller.extend("ui5.requestmanager.controller.NotFound", {
          onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("dashboard");
      },
    }
);
});