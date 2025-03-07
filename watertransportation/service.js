import angular from 'angular';

/**
 * Watertransportation
 * Provides support for the old GXP customization, which provided an
 * EgidPersonList popup when clicking on a EgidPersonList link.
 * @constructor
 * @struct
 * @param {angular.$injector} $injector Main injector.
 * @param {import("ngeo/message/Popup.js").PopupFactory} ngeoCreatePopup Popup service.
 * @ngInject
 * @ngdoc service
 * @ngname geoportalEgidPersonListService
 */
export function Watertransportation($injector, ngeoCreatePopup) {
  /**
   * @type {angular.$injector}
   * @private
   */
  this.$injector_ = $injector;

  /**
   * @type {ngeo.CreatePopup}
   * @private
   */
  this.createPopup_ = ngeoCreatePopup;
}

/**
 * @export
 */
WatertransportationService.prototype.init = function () {
  //console.log('init');
  if (this.$injector_.has('watertransportationUrl')) {
    const egidUrl = this.$injector_.get('watertransportationUrlUrl');
    //console.log('has value: ' + egidUrl);

    window['schwyz'] = window['schwyz'] || {};
    window['schwyz']['watertransportationWin'] = (egid) => {
      const popup = this.createPopup_();
      popup.setAutoDestroy(true);
      popup.addClass('popup-with-iframe');
      popup.setTitle('Wassertransport');
      //popup.setUrl(egidUrl.replace('9999', egid));
      popup.setSize('60%', '60%');
      popup.setOpen(true);
    };
  } else {
    console.warn('watertransportationUrl is not defined');
  }
};

const servicemodule = angular.module('watertransportationModule', []);

servicemodule.service('watertransportationService', WatertransportationService);
export default servicemodule;
