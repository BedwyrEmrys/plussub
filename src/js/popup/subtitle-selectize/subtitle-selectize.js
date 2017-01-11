/**
 * Created by sonste on 28.12.2016.
 */
Polymer({

    is: 'subtitle-selectize',
    behaviors: [ServiceChannelBehavior, MetaChannelBehavior],
    properties: {
        currentSelected: {
            type: Object,
            value: () => Object.assign({}),
            observer: '_currentSelectedChanged'
        },
        _currentMovie: {
            type: Object,
            value: () => Object.assign({})
        },
        _currentLanguage: {
            type: Object,
            value: () => Object.assign({})
        }
    },
    metaSubscriptions: [
        {
            topic: "selected_movie.entry",
            callback: "movieChanged",
            notifyWhenWriteOnChannel: true
        },
        {
            topic: "selected_subtitle_language.entry",
            callback: "languageChanged",
            notifyWhenWriteOnChannel: true
        }
    ],


    ready: function () {
        this.async(() => {
            this.metaSubscribeOnce({
                topic: 'selected_subtitle.entry',
                callback: (subtitleMeta) => {

                    var subtitleMetaAsString = JSON.stringify(subtitleMeta);
                    this.$.subtitleSelection.addOption(Object.assign({}, subtitleMeta, {valueField: subtitleMetaAsString}));
                    this.$.subtitleSelection.addItem(subtitleMetaAsString);
                }
            });

            this.servicePublish({
                topic: srtPlayer.ServiceDescriptor.BACKEND_SERVICE.META.SUB.PUBLISH,
                data: 'selected_subtitle.entry'
            });

            this.serviceSubscribe({
                topic: srtPlayer.ServiceDescriptor.BACKEND_SERVICE.DOWNLOAD.PUB.SEARCH_RESULT,
                callback: (result) => {
                    var oldCurrentSelected = this.currentSelected;

                    this.$.subtitleSelection.clearOptions();
                    if(!Array.isArray(result)||result.length===0){
                        return;
                    }

                    var _result = result.map(entry =>  Object.assign(entry, {valueField: JSON.stringify(entry)}));
                    this.$.subtitleSelection.load(_result);

                    //selection did not change, take old selection
                    var select = oldCurrentSelected.idSubtitleFile === _result[0].idSubtitleFile ? oldCurrentSelected : _result[0];
                    this.$.subtitleSelection.addItem(select.valueField);
                }
            });
        });
    },

    _currentSelectedChanged: function (subtitle) {
        "use strict";
        if (!subtitle || Object.keys(subtitle).length===0) {
            this.servicePublish({
                topic: srtPlayer.ServiceDescriptor.BACKEND_SERVICE.META.SUB.RESET,
                data: 'selected_subtitle'
            });
            return;
        }

        //notify
        this.metaPublish({
            topic: 'selected_subtitle.entry',
            data: subtitle
        });
    },

    movieChanged: function (movieMeta) {
        this._currentMovie = movieMeta;
        this._refreshItems();
    },

    languageChanged: function (language) {
        this._currentLanguage = language;
        this._refreshItems();
    },

    _refreshItems: function () {
        this.debounce('_subtitle_refresh', () => {
            if (!this._currentLanguage || Object.keys(this._currentLanguage).length === 0 || !this._currentMovie || Object.keys(this._currentMovie).length === 0) {
                console.log("whoops");
                return;
            }

            this.servicePublish({
                topic: srtPlayer.ServiceDescriptor.BACKEND_SERVICE.DOWNLOAD.SUB.SEARCH,
                data: {
                    imdbid: this._currentMovie.imdbID,
                    iso639: this._currentLanguage.iso639
                }
            });
        }, 300);
    }

});