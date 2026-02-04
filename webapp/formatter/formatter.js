sap.ui.define([], function () {
  "use strict";

  return {
    priorityState: function (sPriority) {
      if (sPriority === "High") return "Error";
      if (sPriority === "Medium") return "Warning";
      if (sPriority === "Low") return "Success";
      return "None";
    },

    priorityIcon: function (sPriority) {
      if (sPriority === "High") return "sap-icon://error";
      if (sPriority === "Medium") return "sap-icon://warning";
      if (sPriority === "Low") return "sap-icon://information";
      return "";
    },

    statusState: function (sStatus) {
      if (sStatus === "Open") return "Warning";
      if (sStatus === "In Progress") return "Information";
      if (sStatus === "Closed") return "Success";
      return "None";
    }
  };
});
