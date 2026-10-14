(function () {
  var ns = $.namespace("pskl.controller.dialogs");

  ns.AbstractDialogController = function () {};

  ns.AbstractDialogController.prototype.init = function (optContainer) {
    this.container = optContainer || document;
    var closeButton = this.container.querySelector(".dialog-close");
    if (closeButton) {
      this.addEventListener(closeButton, "click", this.closeDialog);
    }
  };

  ns.AbstractDialogController.prototype.addEventListener = function (
    el,
    type,
    cb
  ) {
    pskl.utils.Event.addEventListener(el, type, cb, this);
  };

  ns.AbstractDialogController.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
    this.container = null;
  };

  ns.AbstractDialogController.prototype.closeDialog = function () {
    if (typeof this.onCloseCallback === "function") {
      this.onCloseCallback();
    } else {
      $.publish(Events.DIALOG_HIDE);
    }
  };

  ns.AbstractDialogController.prototype.setTitle = function (title) {
    var container = this.container || document;
    var dialogTitle = container.querySelector(".dialog-title");
    if (dialogTitle) {
      dialogTitle.innerText = title;
    }
  };
})();
