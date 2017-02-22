'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FuseBoxLoader = exports.TextTemplateLoader = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _aureliaLoader = require('aurelia-loader');

var _aureliaPal = require('aurelia-pal');

var _aureliaMetadata = require('aurelia-metadata');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TEMPLATE_PLUGIN_NAME = 'template-registry-entry';
var PKG_NAME = FuseBox.defaultPackageName || 'default';

function ensureOriginOnExports(executed, name) {
    var target = executed;
    var key = void 0;
    var exportedValue = void 0;

    if (target.__useDefault) {
        target = target['default'];
    }

    _aureliaMetadata.Origin.set(target, new _aureliaMetadata.Origin(name, 'default'));

    for (key in target) {
        exportedValue = target[key];

        if (typeof exportedValue === 'function') {
            _aureliaMetadata.Origin.set(exportedValue, new _aureliaMetadata.Origin(name, key));
        }
    }

    return executed;
}

var TextTemplateLoader = exports.TextTemplateLoader = function () {
    function TextTemplateLoader() {
        _classCallCheck(this, TextTemplateLoader);
    }

    _createClass(TextTemplateLoader, [{
        key: 'loadTemplate',
        value: function loadTemplate(loader, entry) {
            return loader.loadText(entry.address).then(function (text) {
                entry.template = _aureliaPal.DOM.createTemplateFromMarkup(text);
            });
        }
    }]);

    return TextTemplateLoader;
}();

var FuseBoxLoader = exports.FuseBoxLoader = function (_Loader) {
    _inherits(FuseBoxLoader, _Loader);

    function FuseBoxLoader() {
        _classCallCheck(this, FuseBoxLoader);

        var _this = _possibleConstructorReturn(this, (FuseBoxLoader.__proto__ || Object.getPrototypeOf(FuseBoxLoader)).call(this));

        _this.loaderPlugins = Object.create(null);
        _this.moduleRegistry = Object.create(null);

        _this.useTemplateLoader(new TextTemplateLoader());
        _this.useTemplateRegistryEntryPlugin();
        return _this;
    }

    _createClass(FuseBoxLoader, [{
        key: 'useTemplateLoader',
        value: function useTemplateLoader(templateLoader) {
            this.templateLoader = templateLoader;
        }
    }, {
        key: 'getTemplateRegistryEntry',
        value: function getTemplateRegistryEntry(address) {
            var entry = this.getOrCreateTemplateRegistryEntry(address);
            if (entry.templateIsLoaded) return entry;
            return this.templateLoader.loadTemplate(this, entry).then(function (x) {
                return entry;
            });
        }
    }, {
        key: 'useTemplateRegistryEntryPlugin',
        value: function useTemplateRegistryEntryPlugin() {
            var self = this;
            this.addPlugin(TEMPLATE_PLUGIN_NAME, {
                'fetch': self.getTemplateRegistryEntry.bind(self)
            });
        }
    }, {
        key: 'map',
        value: function map(id, source) {}
    }, {
        key: 'normalizeSync',
        value: function normalizeSync(moduleId, relativeTo) {
            return moduleId;
        }
    }, {
        key: 'normalize',
        value: function normalize(moduleId, relativeTo) {
            return Promise.resolve(moduleId);
        }
    }, {
        key: '_loadAndRegister',
        value: function _loadAndRegister(id) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                try {
                    var _m = FuseBox.import(id);
                    _this2.moduleRegistry[id] = _m;
                    resolve(ensureOriginOnExports(_m, id));
                } catch (error) {
                    reject(error);
                }
            });
        }
    }, {
        key: 'loadModule',
        value: function loadModule(id) {
            var _this3 = this;

            var existing = this.moduleRegistry[id];
            if (existing) return Promise.resolve(existing);

            if (FuseBox.exists(id)) return this._loadAndRegister(id);

            if (id.indexOf('!') > -1) {
                return this._import(id).then(function (result) {
                    _this3.moduleRegistry[id] = result;
                    return ensureOriginOnExports(m, id);
                });
            }

            if (FuseBox.exists(PKG_NAME + '/' + id)) {
                return this._loadAndRegister(PKG_NAME + '/' + id);
            }

            var moduleId = Object.keys(FuseBox.packages).find(function (name) {
                return id.startsWith(name + '/');
            });

            if (moduleId) {
                var resources = Object.keys(FuseBox.packages[moduleId].f);
                var resourceName = id.replace(moduleId + '/', '');
                var resourceEntry = resources.find(function (r) {
                    return r.endsWith(resourceName + '.js');
                });
                return this._loadAndRegister(moduleId + '/' + resourceEntry);
            }

            throw new Error('Unable to load module with ID: ' + id);
        }
    }, {
        key: 'loadAllModules',
        value: function loadAllModules(ids) {
            var _this4 = this;

            return Promise.all(ids.map(function (id) {
                return _this4.loadModule(id);
            }));
        }
    }, {
        key: 'loadTemplate',
        value: function loadTemplate(url) {
            return this._import(this.applyPluginToUrl(url, TEMPLATE_PLUGIN_NAME));
        }
    }, {
        key: '_import',
        value: function _import(address) {
            var _address$split = address.split('!'),
                _address$split2 = _slicedToArray(_address$split, 2),
                pluginName = _address$split2[0],
                id = _address$split2[1];

            var plugin = this.loaderPlugins[pluginName];

            return Promise.resolve(plugin.fetch(id));
        }
    }, {
        key: 'loadText',
        value: function loadText(url) {
            return Promise.resolve(FuseBox.import(url)).then(function (m) {
                return typeof m === 'string' ? m : m.default;
            });
        }
    }, {
        key: 'applyPluginToUrl',
        value: function applyPluginToUrl(url, pluginName) {
            return pluginName + '!' + url;
        }
    }, {
        key: 'addPlugin',
        value: function addPlugin(pluginName, implementation) {
            if (this.loaderPlugins[pluginName]) return;
            this.loaderPlugins[pluginName] = implementation;
        }
    }]);

    return FuseBoxLoader;
}(_aureliaLoader.Loader);

_aureliaPal.PLATFORM.Loader = FuseBoxLoader;

/*PLATFORM.eachModule = callback => {
    const moduleIds = Object.getOwnPropertyNames(FuseBox.packages);

    moduleIds
        .forEach(moduleId => {
            let subModules = FuseBox.packages[moduleId].f;
            let ids = Object.getOwnPropertyNames(subModules);
            ids.forEach(id => {
                if (!subModules[id].locals) return;
                const moduleExports = subModules[id].locals.exports;
                if (typeof moduleExports === 'object') {
                    callback(moduleId, moduleExports);
                }
            });
        });
};*/
