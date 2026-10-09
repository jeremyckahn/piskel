(function () {
  var ns = $.namespace("pskl.controller");

  ns.MobileController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.MobileController.prototype.init = function () {
    this.topTabsContainer_ = document.querySelector(".mobile-top-tabs");
    this.bottomNavContainer_ = document.querySelector(".mobile-bottom-nav");
    this.quickSaveBtn_ = document.querySelector(".mobile-quick-save-btn");
    this.quickSwatchesContainer_ = document.querySelector(
      ".mobile-quick-swatches"
    );
    this.brushSizeBtn_ = document.querySelector(".mobile-brush-size-btn");

    if (this.topTabsContainer_) {
      this.topTabsContainer_.addEventListener(
        "click",
        this.onTopTabClick_.bind(this)
      );
    }

    if (this.bottomNavContainer_) {
      this.bottomNavContainer_.addEventListener(
        "click",
        this.onBottomNavClick_.bind(this)
      );
    }

    if (this.quickSaveBtn_) {
      this.quickSaveBtn_.addEventListener(
        "click",
        this.onQuickSaveClick_.bind(this)
      );
    }

    if (this.brushSizeBtn_) {
      this.brushSizeBtn_.addEventListener(
        "click",
        this.onBrushSizeClick_.bind(this)
      );
    }

    $.subscribe(
      Events.CURRENT_COLORS_UPDATED,
      this.updateQuickSwatches_.bind(this)
    );
    $.subscribe(
      Events.PRIMARY_COLOR_SELECTED,
      this.updateActiveSwatch_.bind(this)
    );
    $.subscribe(Events.PEN_SIZE_CHANGED, this.updateBrushSizeBtn_.bind(this));

    this.updateQuickSwatches_();
    this.updateBrushSizeBtn_();
  };

  ns.MobileController.prototype.onTopTabClick_ = function (evt) {
    evt.stopPropagation();
    var tabEl = evt.target.closest("[data-mobile-tab]");
    if (!tabEl) {
      return;
    }

    var tab = tabEl.dataset.mobileTab;
    var allTabs = this.topTabsContainer_.querySelectorAll(".mobile-top-tab");
    allTabs.forEach(function (t) {
      t.classList.remove("active");
    });
    tabEl.classList.add("active");

    document.body.classList.remove(
      "mobile-tab-home",
      "mobile-tab-layers",
      "mobile-tab-settings"
    );

    if (tab === "home") {
      document.body.classList.add("mobile-tab-home");
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    } else if (tab === "layers") {
      document.body.classList.add("mobile-tab-layers");
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    } else if (tab === "settings") {
      document.body.classList.add("mobile-tab-settings");
      if (pskl.app.settingsController) {
        pskl.app.settingsController.loadSetting_("user");
      }
    }

    if (pskl.app.drawingController) {
      pskl.app.drawingController.requestRelayout_();
    }
  };

  ns.MobileController.prototype.onBottomNavClick_ = function (evt) {
    evt.stopPropagation();
    var navEl = evt.target.closest("[data-mobile-nav]");
    if (!navEl) {
      return;
    }

    var navAction = navEl.dataset.mobileNav;
    if (navAction === "menu") {
      // Toggle cheatsheet or browse backups dialog
      $.publish(Events.DIALOG_SHOW, {
        dialogId: "browse-local"
      });
    } else if (navAction === "transform") {
      // Toggle transformations panel/popup or layers
      var isLayers = document.body.classList.contains("mobile-tab-layers");
      if (!isLayers) {
        var layersTab = document.querySelector('[data-mobile-tab="layers"]');
        if (layersTab) {
          layersTab.click();
        }
      }
      var transformContainer = document.querySelector(
        ".transformations-container"
      );
      if (transformContainer) {
        transformContainer.scrollIntoView({ behavior: "smooth" });
      }
    } else if (navAction === "palette") {
      // Open create/edit palette dialog
      $.publish(Events.DIALOG_SHOW, {
        dialogId: "create-palette"
      });
    } else if (navAction === "settings") {
      if (pskl.app.settingsController) {
        pskl.app.settingsController.loadSetting_("user");
      }
    } else if (navAction === "export") {
      if (pskl.app.settingsController) {
        pskl.app.settingsController.loadSetting_("export");
      }
    }
  };

  ns.MobileController.prototype.onQuickSaveClick_ = function (evt) {
    if (evt) {
      evt.stopPropagation();
    }
    if (pskl.app.settingsController) {
      pskl.app.settingsController.loadSetting_("save");
    }
  };

  ns.MobileController.prototype.onBrushSizeClick_ = function () {
    if (pskl.app.penSizeService) {
      var current = pskl.app.penSizeService.getPenSize();
      var next = (current % 4) + 1;
      pskl.app.penSizeService.setPenSize(next);
    }
  };

  ns.MobileController.prototype.updateBrushSizeBtn_ = function () {
    if (!this.brushSizeBtn_ || !pskl.app.penSizeService) {
      return;
    }
    var size = pskl.app.penSizeService.getPenSize();
    var dot = this.brushSizeBtn_.querySelector(".brush-size-dot");
    if (dot) {
      dot.className = "brush-size-dot dot-size-" + size;
    }
  };

  ns.MobileController.prototype.updateQuickSwatches_ = function () {
    if (!this.quickSwatchesContainer_) {
      return;
    }

    var defaultPalette = [
      "#000000",
      "#3b3b3b",
      "#595959",
      "#8c8c8c",
      "#bfbfbf"
    ];
    var currentColors = [];
    if (pskl.app.currentColorsService) {
      currentColors = pskl.app.currentColorsService.getCurrentColors() || [];
    }

    // Combine current colors with default palette, avoiding duplicates, up to 5 colors
    var combinedColors = [];
    currentColors.forEach(function (color) {
      if (color && color !== "TRANSPARENT" && !combinedColors.includes(color)) {
        combinedColors.push(color);
      }
    });

    defaultPalette.forEach(function (color) {
      var exists = combinedColors.some(function (c) {
        return c.toLowerCase() === color.toLowerCase();
      });
      if (!exists && combinedColors.length < 5) {
        combinedColors.push(color);
      }
    });

    var primaryColor = pskl.app.selectedColorsService
      ? pskl.app.selectedColorsService.getPrimaryColor()
      : "#000000";

    var html = "";
    var displayColors = combinedColors.slice(0, 5);
    displayColors.forEach(function (color) {
      var isActive = color.toLowerCase() === (primaryColor || "").toLowerCase();
      html +=
        '<div class="mobile-swatch-item ' +
        (isActive ? "active" : "") +
        '" data-color="' +
        color +
        '" style="background-color: ' +
        color +
        '"></div>';
    });

    this.quickSwatchesContainer_.innerHTML = html;

    var swatches = this.quickSwatchesContainer_.querySelectorAll(
      ".mobile-swatch-item"
    );
    swatches.forEach(function (el) {
      el.addEventListener("click", function () {
        var color = el.dataset.color;
        $.publish(Events.SELECT_PRIMARY_COLOR, [color]);
      });
    });
  };

  ns.MobileController.prototype.updateActiveSwatch_ = function (evt, color) {
    if (!this.quickSwatchesContainer_) {
      return;
    }
    var swatches = this.quickSwatchesContainer_.querySelectorAll(
      ".mobile-swatch-item"
    );
    swatches.forEach(function (el) {
      if (el.dataset.color.toLowerCase() === (color || "").toLowerCase()) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  };
})();
