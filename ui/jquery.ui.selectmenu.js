/*!
 * jQuery UI Selectmenu @VERSION
 * http://jqueryui.com
 *
 * Copyright 2013 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/selectmenu
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 *	jquery.ui.menu.js
 */
(function( $, undefined ) {

$.widget( "ui.selectmenu", {
	version: "@VERSION",
	defaultElement: "<select>",
	options: {
		appendTo: null,
		icons: {
			button: "ui-icon-triangle-1-s"
		},
		position: {
			my: "left top",
			at: "left bottom",
			collision: "none"
		},
		width: null,
		nativeMenu: false,

		// callbacks
		change: null,
		close: null,
		focus: null,
		open: null,
		select: null
	},

	_create: function() {
		var selectmenuId = this.element.uniqueId().attr( "id" );
		this.ids = {
			element: selectmenuId,
			menu: selectmenuId + "-menu"
		};

		this._drawButton();

		if ( !this.options.nativeMenu ) {
			this._drawMenu();
		}

		if ( this.options.disabled ) {
			this.disable();
		}
	},

	_drawButton: function() {
		var that = this;

		// Associate existing label with the new button
		this.label = $( "label[for='" + this.ids.element + "']" );
		this._on( this.label, {
			click: function( event ) {
				if ( !this.options.nativeMenu ) {
					this.open();
					event.preventDefault();
				}
			}
		});

		// Create button
		this.button = $( "<span>", {
			"class": "ui-selectmenu-button ui-widget ui-state-default ui-corner-all",
		})
		.insertAfter( this.element );

		$( "<span>", {
			"class": "ui-icon " + this.options.icons.button
		}).prependTo( this.button );

		this.buttonText = $( "<span>", {
			"class": "ui-selectmenu-text"
		})
		.appendTo( this.button );

		this._setText( this.buttonText, this.element.find( "option:selected" ).text() );
		this._setOption( "width", this.options.width );

		this.element
			.attr({
				role: "combobox",
				"aria-expanded": "false",
				"aria-autocomplete": "list",
				"aria-haspopup": "true"
			})
			.appendTo( this.button );

		this._on( this.element, this._elementEvents );
		this.element.one( "focusin", function() {
			// Delay rendering the menu items until the button receives focus
			that._refresh();
		});

		this._hoverable( this.button );
		this._focusable( this.button );
	},

	_drawMenu: function() {
		var that = this;

		this.element.attr( "aria-owns", this.ids.menu );

		// Create menu
		this.menu = $( "<ul>", {
			"aria-hidden": "true",
			"aria-labelledby": this.ids.element,
			id: this.ids.menu
		});

		// Wrap menu
		this.menuWrap = $( "<div>", {
			"class": "ui-selectmenu-menu ui-front"
		})
		.append( this.menu )
		.appendTo( this._appendTo() );

		// Initialize menu widget
		this.menuInstance = this.menu.menu({
			role: "listbox",
			select: function( event, ui ) {
				var item = ui.item.data( "ui-selectmenu-item" ),
					oldIndex = that.element[ 0 ].selectedIndex;

				// Change native select element
				that.element[ 0 ].selectedIndex = item.index;

				event.preventDefault();
				that._select( item, event );
				if ( item.index !== oldIndex ) {
					that._trigger( "change", event, { item: item } );
				}

				that.close( event );
			},
			focus: function( event, ui ) {
				var item = ui.item.data( "ui-selectmenu-item" );

				// Prevent inital focus from firing and checks if its a newly focused item
				if ( that.focusIndex != null && item.index !== that.focusIndex ) {
					that._trigger( "focus", event, { item: item } );
					if ( !that.isOpen ) {
						that._select( item, event );
					}
				}
				that.focusIndex = item.index;

				that.element.attr( "aria-activedescendant",
					that.menuItems.eq( item.index ).attr( "id" ) );
			}
		})
		.menu( "instance" );

		// Adjust menu styles to dropdown
		this.menu.addClass( "ui-corner-bottom" ).removeClass( "ui-corner-all" );

		// TODO: Can we make this cleaner?
		// If not, at least update the comment to say what we're removing
		// Unbind uneeded menu events
		this.menuInstance._off( this.menu, "mouseleave" );

		// Cancel the menu's collapseAll on document click
		this.menuInstance._closeOnDocumentClick = function() {
			return false;
		};
	},

	refresh: function() {
		this._refresh();
		this._setText( this.buttonText, this.items[ this.element[ 0 ].selectedIndex ].label );
	},

	_refresh: function() {
		var options = this.element.find( "option" ),
			item;

		if ( !options.length ) {
			return;
		}

		this._readOptions( options );

		if ( !this.options.nativeMenu ) {
			this.menu.empty();
			this._renderMenu( this.menu, this.items );

			this.menuInstance.refresh();
			this.menuItems = this.menu.find( "li" ).not( ".ui-selectmenu-optgroup" );

			item = this._getSelectedItem();

			// Update the menu to have the correct item focused
			this.menuInstance.focus( null, item );
			this._setAria( item.data( "ui-selectmenu-item" ) );
		}

		// Set disabled state
		this._setOption( "disabled", this.element.prop( "disabled" ) );
	},

	open: function( event ) {
		if ( this.options.disabled ) {
			return;
		}

		this.isOpen = true;
		this._toggleAttr();
		this._on( this.document, this._documentClick );

		if ( !this.options.nativeMenu ) {
			this._openMenu();
		}

		this._trigger( "open", event );
	},

	_openMenu: function() {
		// If this is the first time the menu is being opened, render the items
		if ( !this.menuItems ) {
			this._refresh();
		} else {
			// TODO: Why is this necessary?
			// Shouldn't the underlying menu always have accurate state?
			this.menu.find( ".ui-state-focus" ).removeClass( "ui-state-focus" );
			this.menuInstance.focus( null, this._getSelectedItem() );
			this.menuItems.eq( this.element[ 0 ].selectedIndex ).addClass( "ui-state-active" );
		}

		this._resizeMenu();
		this._position();
	},

	_position: function() {
		this.menuWrap.position( $.extend( { of: this.button }, this.options.position ) );
	},

	close: function( event ) {
		if ( !this.isOpen ) {
			return;
		}

		this.isOpen = false;
		this._toggleAttr();

		// Check if we have an item to select
		if ( this.menuItems ) {
			this.menuInstance.active = this._getSelectedItem();
		}

		this._off( this.document );

		this._trigger( "close", event );
	},

	widget: function() {
		return this.button;
	},

	menuWidget: function() {
		return this.menu;
	},

	_renderMenu: function( ul, items ) {
		var that = this,
			currentOptgroup = "";

		$.each( items, function( index, item ) {
			if ( item.optgroup !== currentOptgroup ) {
				$( "<li>", {
					"class": "ui-selectmenu-optgroup ui-menu-divider" +
						( item.element.parent( "optgroup" ).attr( "disabled" ) ?
							" ui-state-disabled" :
							"" ),
					text: item.optgroup
				})
				.appendTo( ul );
				currentOptgroup = item.optgroup;
			}
			that._renderItemData( ul, item );
		});
	},

	_renderItemData: function( ul, item ) {
		return this._renderItem( ul, item ).data( "ui-selectmenu-item", item );
	},

	_renderItem: function( ul, item ) {
		var li = $( "<li>" );

		if ( item.disabled ) {
			li.addClass( "ui-state-disabled" );
		}
		this._setText( li, item.label );

		return li.appendTo( ul );
	},

	_setText: function( element, value ) {
		if ( value ) {
			element.text( value );
		} else {
			element.html( "&#160;" );
		}
	},

	_move: function( direction, event ) {
		var filter = ".ui-menu-item",
			item, next;

		if ( this.isOpen ) {
			item = this.menuItems.eq( this.focusIndex );
		} else {
			item = this.menuItems.eq( this.element[ 0 ].selectedIndex );
			filter += ":not(.ui-state-disabled)";
		}

		if ( direction === "first" || direction === "last" ) {
			next = item[ direction === "first" ? "prevAll" : "nextAll" ]( filter ).eq( -1 );
		} else {
			next = item[ direction + "All" ]( filter ).eq( 0 );
		}

		if ( next.length ) {
			this.menu.menu( "focus", event, next );
		}
	},

	_getSelectedItem: function() {
		return this.menuItems.eq( this.element[ 0 ].selectedIndex );
	},

	_toggle: function( event ) {
		if ( this.isOpen ) {
			this.close( event );
		} else {
			this.open( event );
		}
	},

	_documentClick: {
		mousedown: function( event ) {
			if ( this.isOpen && !$( event.target ).closest( ".ui-selectmenu-menu, #" + this.ids.element ).length ) {
				this.close( event );
			}
		}
	},

	_elementEvents: {
		mousedown: function( event ) {
			this._toggle( event );
			if ( !this.options.nativeMenu ) {
				event.preventDefault();
			}
		},
		change: function( event ) {
			var item = this.items[ this.element[ 0 ].selectedIndex ];

			this._select( item, event );
			this._trigger( "change", event, { item: item } );
		},
		keydown: function( event ) {
			if ( !this.options.nativeMenu ) {
				this._buttonEvent( event );
			}
		}
	},

	_buttonEvent: function ( event ){
		var preventDefault = true;

		switch ( event.keyCode ) {
			case $.ui.keyCode.TAB:
			case $.ui.keyCode.ESCAPE:
				this.close( event );
				preventDefault = false;
				break;
			case $.ui.keyCode.ENTER:
				if ( this.isOpen ) {
					this._selectMenu( event );
				}
				break;
			case $.ui.keyCode.UP:
				if ( event.altKey ) {
					this._toggle( event );
				} else {
					this._move( "prev", event );
				}
				break;
			case $.ui.keyCode.DOWN:
				if ( event.altKey ) {
					this._toggle( event );
				} else {
					this._move( "next", event );
				}
				break;
			case $.ui.keyCode.SPACE:
				if ( this.isOpen ) {
					this._selectMenu( event );
				} else {
					this._toggle( event );
				}
				break;
			case $.ui.keyCode.LEFT:
				this._move( "prev", event );
				break;
			case $.ui.keyCode.RIGHT:
				this._move( "next", event );
				break;
			case $.ui.keyCode.HOME:
			case $.ui.keyCode.PAGE_UP:
				this._move( "first", event );
				break;
			case $.ui.keyCode.END:
			case $.ui.keyCode.PAGE_DOWN:
				this._move( "last", event );
				break;
			default:
				this.menu.trigger( event );
				preventDefault = false;
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	},

	_selectMenu: function( event ) {
		if ( !this.menuItems.eq( this.focusIndex ).hasClass( "ui-state-disabled" ) ) {
			this.menuInstance.select( event );
		}
	},

	_select: function( item, event ) {
		this._setText( this.buttonText, item.label );
		this._trigger( "select", event, { item: item } );

		if ( !this.options.nativeMenu ) {
			this._setAria( item );
		}
	},

	_setAria: function( item ) {
		var id = this.menuItems.eq( item.index ).attr( "id" );

		this.element.attr({
			"aria-labelledby": id,
			"aria-activedescendant": id
		});
		this.menu.attr( "aria-activedescendant", id );
	},

	_setOption: function( key, value ) {
		if ( key === "icons" ) {
			this.button.find( "span.ui-icon" )
				.removeClass( this.options.icons.button )
				.addClass( value.button );
		}

		this._super( key, value );

		if ( key === "appendTo" ) {
			this.menuWrap.appendTo( this._appendTo() );
		}
		if ( key === "disabled" ) {
			if ( !this.options.nativeMenu ) {
				this.menuInstance.option( "disabled", value );
			}
			this.button.toggleClass( "ui-state-disabled", value );

			this.element
				.attr( "aria-disabled", value )
				.prop( "disabled", value );
		}
		if ( key === "width" ) {
			if ( !value ) {
				value = this.element.outerWidth();
			}
			this.button.outerWidth( value );
		}
	},

	_appendTo: function() {
		var element = this.options.appendTo;

		if ( element ) {
			element = element.jquery || element.nodeType ?
				$( element ) :
				this.document.find( element ).eq( 0 );
		}

		if ( !element ) {
			element = this.element.closest( ".ui-front" );
		}

		if ( !element.length ) {
			element = this.document[ 0 ].body;
		}

		return element;
	},

	_toggleAttr: function(){
		this.element.attr( "aria-expanded", this.isOpen );

		if ( !this.options.nativeMenu ) {
			this.button
				.toggleClass( "ui-corner-top", this.isOpen )
				.toggleClass( "ui-corner-all", !this.isOpen );
			this.menuWrap.toggleClass( "ui-selectmenu-open", this.isOpen );
			this.menu.attr( "aria-hidden", !this.isOpen );
		}
	},

	_resizeMenu: function() {
		this.menu.outerWidth( Math.max(
			this.button.outerWidth(),
			this.menu.width( "" ).outerWidth()
		) );
	},

	_getCreateOptions: function() {
		return { disabled: this.element.prop( "disabled" ) };
	},

	_readOptions: function( options ) {
		var data = [];
		options.each( function( index, item ) {
			var option = $( item ),
				optgroup = option.parent( "optgroup" );
			data.push({
				element: option,
				index: index,
				value: option.attr( "value" ),
				label: option.text(),
				optgroup: optgroup.attr( "label" ) || "",
				disabled: optgroup.attr( "disabled" ) || option.attr( "disabled" )
			});
		});
		this.items = data;
	},

	_destroy: function() {
		this.element.removeUniqueId();
		this.element.before( this.button );
		this._off( this.label );
		this.button.remove();
		this.menuWrap.remove();
	}
});

}( jQuery ));
