// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;( function( $, window, document, undefined ) {

	"use strict";

		// Create the defaults once
		var pluginName = "jac";
		var	_defs = {
				tz: "America/Chicago",
				startWeek: 0,
				time: moment(),
				dayTpl: 'cal-day-tpl',
				eventTpl: 'cal-event-tpl',
				weekdayFormat: 'dddd',
				calendarDateFormat: 'D',
				otherMonthClass: 'other-month',
				calendarTitleFormat: 'MMMM YYYY',
				events: {},
				highlightToday: true,
				todayHighlightClass: 'today',
			};

		// The actual plugin constructor
		function Plugin ( _element, _opts )
		{
			var _elem = $( _element ).attr( 'id' );
			this._elem = $( '#' + _elem );
			this._elem.addClass( 'jac-calendar' );

			if( this._elem.data() )
			{
				_defs = $.extend( {}, _defs, this._elem.data() );
			}

			this.settings = $.extend( {}, _defs, _opts );

			this._defaults = _defs;
			this._name = pluginName;
			this.init();
		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype,
		{
			init: function()
			{
				if( true !== this.settings.time._isAMomentObject )
				{
					this.settings.time = moment( this.settings.time );
				}

				this.settings.time.date( 1 );

				this._elem.data( 'time', this.settings.time.toISOString() );

				this.setCalTitle( this.settings.time.toISOString() );
				this.setWeekdayHeader( this.settings.startWeek );
				this.numberDates();
				this.getEvents();
				this.setHandlers();
			},
			setCalTitle: function( _date )
			{
				var _manip = moment( _date );
				$( '.calendar-title' ).text( _manip.format( this.settings.calendarTitleFormat ) );
			},
			setWeekdayHeader: function( _weekStart )
			{
				var _start = moment().day( _weekStart );
				$( '.wkdy0' ).text( _start.format( this.settings.weekdayFormat ) );
				$( '.wkdy1' ).text( _start.add( 1, 'days' ).format( this.settings.weekdayFormat ) );
				$( '.wkdy2' ).text( _start.add( 1, 'days' ).format( this.settings.weekdayFormat ) );
				$( '.wkdy3' ).text( _start.add( 1, 'days' ).format( this.settings.weekdayFormat ) );
				$( '.wkdy4' ).text( _start.add( 1, 'days' ).format( this.settings.weekdayFormat ) );
				$( '.wkdy5' ).text( _start.add( 1, 'days' ).format( this.settings.weekdayFormat ) );
				$( '.wkdy6' ).text( _start.add( 1, 'days' ).format( this.settings.weekdayFormat ) );
			},
			numberDates: function()
			{
				$( '.today' ).removeClass( 'today' );

				var _firstDate = this.getFirstDate();
				var _month = _firstDate.clone();

				var _startWeek = this.settings.startWeek;
				var _time = this.settings.time;

				for( var _i = 1; _i <= 6; _i++ )
				{
					for( var _j = 1; _j <= 7; _j++ )
					{
						var _sel = '.w' + _i + ' .d' + _j;
						$( _sel ).html( $( '#' + this.settings.dayTpl ).html() );

						$( _sel + ' > .calendar-date' ).text( _month.format( this.settings.calendarDateFormat ) );
						if( _time.format( 'M' ) !=  _month.format( 'M' ) )
						{
							$( _sel ).addClass( this.settings.otherMonthClass );
						}
						else
						{
							$( _sel ).removeClass( this.settings.otherMonthClass );
						}

						$( _sel )
							.removeClass(
								function( _index, _className )
								{
									return (_className.match (/(^|\s)jac-\S+/g) || []).join( ' ' );
								})
							.addClass( 'jac-' + _month.format( 'YYYYMMDD' ) );

						var _today = 0;
						if( this.settings.highlightToday && _month.format( 'YYYYMMDD' ) == moment().format( 'YYYYMMDD' ) )
						{
							console.log( 'today' );
							console.log( _month.format( 'YYYYMMDD' ) );
							console.log( moment().format( 'YYYYMMDD' ) );
							$( '.jac-' + _month.format( 'YYYYMMDD' ) ).addClass( this.settings.todayHighlightClass );
							_today = 1;
						}

						$( this._elem ).trigger( 'number:date', {selector: _sel, date: _month.format( 'YYYY-MM-DD' ), isToday: _today} );

						_month.add( 1, 'days' );
					}
				}
			},
			getFirstDate: function()
			{
				var _time = this.settings.time;
				var _monthFirst = _time.startOf( 'month' );
				var _month = _monthFirst.clone();

				var _start = this.settings.startWeek;

				if( _monthFirst.day() == _start )
				{
					return _monthFirst;
				}

				while( _month.day() != _start )
				{
					_month.subtract( 1, 'days' );
				}

				return _month;
			},
			getEvents: function()
			{
				// Get the day tpl
				var _tpl = $( '#' + this.settings.eventTpl ).html();
				if( this.settings.src || this.settings.events )
				{
					if( this.settings.events.length )
					{
						for( var _i in this.settings.events )
						{
							var _item = this.settings.events[_i];
							_item.start_time = moment( _item.start_time );
							_item.end_time = moment( _item.end_time );
							$( this._elem ).trigger( 'render:event:before', _item );
							this.renderEvent( _item.start_time.format( 'YYYYMMDD' ), _item );
							$( this._elem ).trigger( 'render:event:after', _item );
						}
					}
					else
					{
						var _separator = '&';
						if( -1 == this.settings.src.indexOf( '?' ) )
						{
							_separator = '?';
						}

						var _slice = moment( this.settings.time );
						$.getJSON(
							this.settings.src + _separator + 'jac-time=' + _slice.utc().format(),
							function( _events )
							{
								$( '.jac-calendar' ).jac({ events: _events });
							}
						);

					}
				}
				else
				{
					console.log( 'Um, no source to query for events.' );
				}

				this.setHandlers();
				return this;
			},
			renderEvent: function( _date, _event )
			{
				var _tmpDOM = $( '<event></event>' ).append( $.parseHTML( $.trim( $( '#' + this.settings.eventTpl ).html() ) ) );

				for( var _i in _event )
				{
					if( true === _event[_i]._isAMomentObject )
					{
						if( 'format' in $( '.event-' + _i, _tmpDOM ).data() )
						{
							var _tmp = moment( _event[_i] );
							_event[_i] = _tmp.format( $( '.event-' + _i, _tmpDOM ).data( 'format' ) );
						}
					}

					$( '.event-' + _i, _tmpDOM ).text( _event[_i] );
				}

				$( 'div.event', _tmpDOM ).attr( 'id', 'event-' + _event.id );
				$( this._elem ).trigger( 'render:event', _tmpDOM );
				$( $( _tmpDOM ).filter( 'event' ).html() ).appendTo( '.jac-' + _date + ' > .events' );
				return this;
			},
			setHandlers: function()
			{
				$( '.cal-btn-prev' ).unbind( 'click.' + pluginName );
				$( '.cal-btn-prev' ).on( 'click.' + pluginName,
										function( _e )
										{
											$( 'body' ).trigger( 'goto:prev' );
											var _month = moment( $( '.jac-calendar' ).data( 'time' ) );
											$( '#' + $( '.jac-calendar' ).attr( 'id' ) ).removeClass( 'jac-calendar' ).jac({ time: _month.subtract( 1, 'months' ) });
										});
				$( '.cal-btn-next' ).unbind( 'click.' + pluginName );
				$( '.cal-btn-next' ).on( 'click.' + pluginName,
										function()
										{
											$( 'body' ).trigger( 'goto:next' );
											var _month = moment( $( '.jac-calendar' ).data( 'time' ) );
											$( '#' + $( '.jac-calendar' ).attr( 'id' ) ).removeClass( 'jac-calendar' ).jac({ time: _month.add( 1, 'months' ) });
										});
				$( '.cal-btn-today' ).unbind( 'click.' + pluginName );
				$( '.cal-btn-today' ).on( 'click.' + pluginName,
										function()
										{
											$( 'body' ).trigger( 'goto:today' );
											$( '#' + $( '.jac-calendar' ).attr( 'id' ) ).removeClass( 'jac-calendar' ).jac({ time: moment() });
										});
				$( '.event' ).unbind( 'click.' + pluginName );
				$( '.event' ).on( 'click.' + pluginName,
									function( _e )
									{
										$( 'body' ).trigger( 'select:event', _e );
										_e.stopPropagation();
									});
				$( '.day' ).unbind( 'click.' + pluginName );
				$( '.day' ).on( 'click.' + pluginName,
								function( _e )
								{
									$( 'body' ).trigger( 'select:day', _e );
								});
				return this;
			}
		} );

		$.fn[ pluginName ] = function( _opts ) {
			return $.data( this, "plugin_" + pluginName, new Plugin( this, _opts ) );
		};

} )( jQuery, window, document );