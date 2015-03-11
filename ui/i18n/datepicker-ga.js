/* Irish initialization for the jQuery UI date picker plugin. */
/* Written by Laura. */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "../datepicker" ], factory );
	} else {

		// Browser globals
		factory( jQuery.datepicker );
	}
}(function( datepicker ) {

datepicker.regional['ga'] = {
	closeText: 'Deanta', 
	prevText: 'Roimhe',
	nextText: 'Ar aghaidh',
	currentText: 'Inniu',
	monthNames: ['Eanáir','Feabhra','Márta','Aibrean','Bealtaine','Meitheamh',
	'Iúil','Lúnasa','Meán Fomhar','Deireadh Fomhar','Samhain','Nollaig'],
	monthNamesShort: ['Ean', 'Feabh', 'Már', 'Aib', 'Beal', 'Meith',
		'Iúil', 'Lún', 'M Fomh', 'D Fomh', 'Samh', 'Noll'],
	dayNames: ['Domhnach', 'Luan', 'Máirt', 'Céadaoin', 'Déardaoin', 'Aoine', 'Satharn'],
	dayNamesShort: ['Do', 'Lu', 'Ma', 'Cé', 'Dé', 'Ao', 'Sa'],
	dayNamesMin: ['D','L','M','C','D','A','S'],
	weekHeader: 'Sn',
	dateFormat: 'dd/mm/yy',
	firstDay: 1,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: ''};
datepicker.setDefaults(datepicker.regional['ga']);

return datepicker.regional['ga'];

}));
