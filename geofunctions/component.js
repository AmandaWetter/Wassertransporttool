/**
 * @module gr_mapfish3.geofunctions.component
 */
import angular from 'angular';

import { Draw } from 'ol/interaction.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { listen } from 'ol/events.js';
import ngeoMiscToolActivate from 'ngeo/misc/ToolActivate.js';
import { ThemeEventType } from 'gmf/theme/Manager.js';
import 'ui-select/dist/select.min.js';

import 'ui-select/dist/select.css';
import './geofunctions.scss';

class Controller {
  /**
   * @param {angular.$http} $http Angular Http service.
   * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
   * @param {angular.Scope} $scope Scope.
   * @param {ngeo.misc.ToolActivateMgr} ngeoToolActivateMgr ngeoToolActivateMgr.
   * @param {gmf.theme.Themes} gmfThemes gmf Themes service.
   * @ngInject
   */
  constructor($http, gettextCatalog, $scope, ngeoToolActivateMgr, gmfThemes) {
    /**
     * @type {angular.$http}
     * @private
     */
    this.http_ = $http;

    /**
     * @type {angularGettext.Catalog}
     * @private
     */
    this.gettextCatalog = gettextCatalog;

    /**
     * @type {angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * The ngeo ToolActivate manager service.
     * @type {ngeo.misc.ToolActivateMgr}
     */
    this.ngeoToolActivateMgr = ngeoToolActivateMgr;

    /**
     * @type {!ol.Map}
     */
    this.map;

    /**
     * @type {object}
     */
    this.iconcallback;

    /**
     * @type {boolean}
     */
    this.panelactive;

    /**
     * @type {string}
     */
    this.username;

    /**
     * @type {string}
     * @export
     */
    this.currentTheme;

    // Theme change to update filtered geofunction themes
    $scope.$root.$on(ThemeEventType.THEME_NAME_SET, (event, name) => {
      this.currentTheme = name;
      this.resetState();
      this.updateTheme();
    });

    /**
     * @type {array}
     */
    this.themes = [];

    /**
     * @type {array}
     */
    this.filteredThemes = [];

    /**
     * @type {string}
     */
    this.selectedTheme;

    /**
     * @type {ol.Source}
     */
    this.source;

    /**
     * @type {ol.Layer}
     */
    this.vector;

    /**
     * @type {object}
     */
    this.standardGeometryTypes = {
      'point': 'point',
      'length': 'line',
      'area': 'polygon',
    };

    /**
     * @type {object}
     */
    this.geometryTypes = {
      'point': 'Point',
      'line': 'LineString',
      'polygon': 'Polygon',
    };

    /**
     * @type {object}
     * used to get automatic string extraction
     */
    this.geomTexts = {
      'point': this.gettextCatalog.getString('point geom text'),
      'line': this.gettextCatalog.getString('line geom text'),
      'polygon': this.gettextCatalog.getString('polygon geom text'),
    };

    /**
     * @type {boolean}
     */
    this.layerAdded = false;

    /**
     * @type {string}
     */
    this.geomText = '';

    this.availableGmfThemeNames = [];

    listen(gmfThemes, 'change', () => {
      gmfThemes.getThemesObject().then((themes) => {
        this.availableGmfThemeNames = [];
        for (const theme of themes) {
          this.availableGmfThemeNames.push(theme.name);
        }
        this.updateTheme();
      });
    });
  }

  $onInit() {
    this.getThemeService();
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });

    this.scope_.$on(
      'geofunctionsPanelChange',
      (e) => {
        // delayed check because otherwise the panelactive has not been updated
        setTimeout(() => {
          if (!this.panelactive) {
            this.resetState();
          }
        }, 0);
      },
      this
    );

    // init all interaction and tools
    this.initInteractions();
  }

  resetState() {
    this.resetMap();
    this.selectedTheme = null;
    this.iconcallback(null);
  }

  updateTheme() {
    if (this.availableGmfThemeNames.includes(this.currentTheme)) {
      this.filteredThemes = this.themes.filter((item) => item.theme_name == this.currentTheme);
    }
  }

  getThemeService() {
    this.http_
      .get('/get_theme_service')
      .then((response) => {
        this.themes = response.data.themes;
        this.updateTheme();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  themeChanged() {
    this.resetMap();

    if (!this.selectedTheme) {
      // user selected the default entry
      this.iconcallback(null);
      return;
    }

    const geomType = this.getGeometryType();

    // call callback to update tool icon in main tool menu
    this.iconcallback(geomType);

    // update geom text
    this.geomText = this.gettextCatalog.getString(this.geomTexts[geomType]);

    this.addLayer();
    this.addInteractions();
  }

  addLayer() {
    if (!this.layerAdded) {
      this.map.addLayer(this.vector);
      this.layerAdded = true;
    }
  }

  initInteractions() {
    this.drawPoint = new Draw({
      source: this.source,
      type: this.geometryTypes['point'],
    });
    this.drawPoint.on(
      'drawend',
      (e) => {
        this.queryExternalService(e.feature);
      },
      this
    );
    this.drawPointTool = new ngeoMiscToolActivate(this.drawPoint, 'geofunctionsPanelActive');
    this.ngeoToolActivateMgr.registerTool('geofunctionTools', this.drawPointTool, false);
    this.ngeoToolActivateMgr.deactivateTool(this.drawPointTool);

    this.drawLine = new Draw({
      source: this.source,
      type: this.geometryTypes['line'],
    });
    this.drawLine.on(
      'drawend',
      (e) => {
        this.queryExternalService(e.feature);
      },
      this
    );
    this.drawLineTool = new ngeoMiscToolActivate(this.drawLine, 'geofunctionsPanelActive');
    this.ngeoToolActivateMgr.registerTool('geofunctionTools', this.drawLineTool, false);
    this.ngeoToolActivateMgr.deactivateTool(this.drawLineTool);

    this.drawPolygon = new Draw({
      source: this.source,
      type: this.geometryTypes['polygon'],
    });
    this.drawPolygon.on(
      'drawend',
      (e) => {
        this.queryExternalService(e.feature);
      },
      this
    );
    this.drawPolygonTool = new ngeoMiscToolActivate(this.drawPolygon, 'geofunctionsPanelActive');
    this.ngeoToolActivateMgr.registerTool('geofunctionTools', this.drawPolygonTool, false);
    this.ngeoToolActivateMgr.deactivateTool(this.drawPolygonTool);
  }

  /**
   * add intercation on map and enable corresponding tool
   */
  addInteractions() {
    switch (this.getGeometryType()) {
      case 'point':
        this.activeInteraction = this.drawPoint;
        this.activeTool = this.drawPointTool;
        break;
      case 'line':
        this.activeInteraction = this.drawLine;
        this.activeTool = this.drawLineTool;
        break;
      default:
        this.activeInteraction = this.drawPolygon;
        this.activeTool = this.drawPolygonTool;
    }
    this.map.addInteraction(this.activeInteraction);
    this.ngeoToolActivateMgr.activateTool(this.activeTool);
  }

  resetMap() {
    if (typeof this.activeInteraction !== 'undefined') {
      this.map.removeInteraction(this.activeInteraction);
      this.ngeoToolActivateMgr.deactivateTool(this.activeTool);
    }

    this.source.clear();
    this.geomText = '';
  }

  queryExternalService(feature) {
    const urlWebservice = this.selectedTheme.webservice;
    const themeName = this.selectedTheme.theme_name;

    const listPointCoord = feature.getGeometry().flatCoordinates;

    let urlServiceLine = `${urlWebservice}?THEME=${themeName}&NRCOORD=${listPointCoord.length / 2}&COORD=`;

    for (let i = 0; i < listPointCoord.length; i++) {
      urlServiceLine += listPointCoord[i];
      if (i % 2 == 0) {
        urlServiceLine += ',';
      } else {
        urlServiceLine += ';';
      }
    }
    if (listPointCoord.length > 0) {
      // remove last ;
      urlServiceLine = urlServiceLine.slice(0, -1);
    }

    // todo ?
    // urlServiceLine += "&WMSURL=" + wmsurl;

    if (this.username && this.username !== 'undefined') {
      urlServiceLine += `&USER=${btoa(this.username)}`;
    }

    window.open(urlServiceLine, 'Geofunction', 'resizable=1,scrollbars=1,menubar=1,height=600,width=800');

    setTimeout(() => {
      // clean up last drawing, delayed because otherwise the new drawing is added after the cleanup
      this.source.clear();
    }, 0);
  }

  getGeometryType() {
    return this.standardGeometryTypes[this.selectedTheme.type_geom];
  }
}

/**
 * @type {!angular.Module}
 */
const gr_mapfishGeofunctionsModule = angular.module('geofunctions', ['ui.select', 'ngSanitize']);

gr_mapfishGeofunctionsModule.component('geofunctions', {
  bindings: {
    'map': '<',
    'iconcallback': '<',
    'panelactive': '<',
    'username': '<',
  },
  controller: Controller,
  template: require('./geofunctions.html'),
});

export default gr_mapfishGeofunctionsModule;