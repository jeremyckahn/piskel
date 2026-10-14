(function () {
  var ns = $.namespace("pskl.controller");

  ns.MobileController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.MobileController.prototype.init = function () {
    this.bottomNavContainer_ = document.querySelector(".mobile-bottom-nav");
    this.paletteTabPanel_ = document.querySelector("#palette-tab-panel");
    this.quickSaveBtn_ = document.querySelector(".mobile-quick-save-btn");
    this.quickSwatchesContainer_ = document.querySelector(
      ".mobile-quick-swatches"
    );
    this.brushSizeBtn_ = document.querySelector(".mobile-brush-size-btn");

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

    this.paletteController_ = null;
    this.selectTab("canvas");
  };

  ns.MobileController.prototype.selectTab = function (tab, optSetting) {
    if (tab === "home") {
      tab = "canvas";
    } else if (tab === "layers") {
      tab = "transform";
    }

    this.currentTab_ = tab;

    document.body.classList.remove(
      "mobile-tab-home",
      "mobile-tab-canvas",
      "mobile-tab-layers",
      "mobile-tab-transform",
      "mobile-tab-palette",
      "mobile-tab-settings"
    );

    // Clean up palette controller if leaving palette tab
    if (tab !== "palette" && this.paletteController_) {
      this.paletteController_.destroy();
      this.paletteController_ = null;
      if (this.paletteTabPanel_) {
        this.paletteTabPanel_.innerHTML = "";
      }
    }

    if (tab === "canvas") {
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
      document.body.classList.add("mobile-tab-home", "mobile-tab-canvas");
      this.updateBottomNav_("canvas");
    } else if (tab === "transform") {
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
      document.body.classList.add("mobile-tab-layers", "mobile-tab-transform");
      this.updateBottomNav_("transform");
    } else if (tab === "palette") {
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
      document.body.classList.add("mobile-tab-palette");
      this.updateBottomNav_("palette");
      this.loadPaletteTab_();
    } else if (tab === "settings") {
      document.body.classList.add("mobile-tab-settings");
      var settingToLoad =
        optSetting ||
        (pskl.app.settingsController &&
          pskl.app.settingsController.currentSetting) ||
        "user";
      this.updateBottomNav_(settingToLoad === "export" ? "export" : "settings");
      if (pskl.app.settingsController) {
        pskl.app.settingsController.loadSetting_(settingToLoad);
      }
    } else if (tab === "export") {
      document.body.classList.add("mobile-tab-settings");
      this.updateBottomNav_("export");
      if (pskl.app.settingsController) {
        pskl.app.settingsController.loadSetting_("export");
      }
    }

    if (pskl.app.drawingController) {
      pskl.app.drawingController.requestRelayout_();
    }
  };

  ns.MobileController.prototype.loadPaletteTab_ = function () {
    if (!this.paletteTabPanel_) {
      return;
    }

    var template = pskl.utils.Template.get(
      "templates/dialogs/create-palette.html"
    );
    this.paletteTabPanel_.innerHTML = template;

    var selectedPaletteId = pskl.UserSettings.get(
      pskl.UserSettings.SELECTED_PALETTE
    );

    this.paletteController_ =
      new pskl.controller.dialogs.CreatePaletteController(
        this.piskelController
      );
    this.paletteController_.onCloseCallback = function () {
      this.selectTab("canvas");
    }.bind(this);

    this.paletteController_.init(selectedPaletteId, this.paletteTabPanel_);
  };

  ns.MobileController.prototype.updateBottomNav_ = function (activeNav) {
    if (!this.bottomNavContainer_) {
      return;
    }
    var navItems = this.bottomNavContainer_.querySelectorAll(
      ".mobile-bottom-nav-item"
    );
    navItems.forEach(function (item) {
      if (activeNav && item.dataset.mobileNav === activeNav) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  ns.MobileController.prototype.onBottomNavClick_ = function (evt) {
    evt.stopPropagation();
    var navEl = evt.target.closest("[data-mobile-nav]");
    if (!navEl) {
      return;
    }

    var navAction = navEl.dataset.mobileNav;
    if (navAction === "canvas") {
      this.selectTab("canvas");
    } else if (navAction === "transform") {
      this.selectTab("transform");
    } else if (navAction === "palette") {
      this.selectTab("palette");
    } else if (navAction === "settings") {
      this.selectTab("settings", "user");
    } else if (navAction === "export") {
      this.selectTab("settings", "export");
    }
  };

  ns.MobileController.prototype.onQuickSaveClick_ = function (evt) {
    if (evt) {
      evt.stopPropagation();
    }
    this.selectTab("settings", "save");
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
