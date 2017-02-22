import { DOM } from 'aurelia-pal';
import { PLATFORM } from 'aurelia-pal';
import { Loader } from 'aurelia-loader';
import { Origin } from 'aurelia-metadata';

const TEMPLATE_PLUGIN_NAME = 'template-registry-entry';
const PKG_NAME = FuseBox.defaultPackageName || 'default';

function ensureOriginOnExports(executed, name) {
    let target = executed;
    let key;
    let exportedValue;

    if (target.__useDefault) {
        target = target['default'];
    }

    Origin.set(target, new Origin(name, 'default'));

    for (key in target) {
        exportedValue = target[key];

        if (typeof exportedValue === 'function') {
            Origin.set(exportedValue, new Origin(name, key));
        }
    }

    return executed;
}

export class TextTemplateLoader {
    loadTemplate(loader, entry) {
        return loader.loadText(entry.address)
            .then(text => {
                entry.template = DOM.createTemplateFromMarkup(text);
            });
    }
}

export class FuseBoxLoader extends Loader {

    constructor() {
        super();

        this.loaderPlugins = Object.create(null);
        this.moduleRegistry = Object.create(null);

        this.useTemplateLoader(new TextTemplateLoader());
        this.useTemplateRegistryEntryPlugin();
    }

    useTemplateLoader(templateLoader) {
        this.templateLoader = templateLoader;
    }

    getTemplateRegistryEntry(address) {
        const entry = this.getOrCreateTemplateRegistryEntry(address);
        if (entry.templateIsLoaded) return entry;
        return this.templateLoader.loadTemplate(this, entry).then(x => entry);
    };

    useTemplateRegistryEntryPlugin() {
        let self = this;
        this.addPlugin(TEMPLATE_PLUGIN_NAME, {
            'fetch': self.getTemplateRegistryEntry.bind(self)
        });
    }

    map(id, source) {}
    normalizeSync(moduleId, relativeTo) { return moduleId; }
    normalize(moduleId, relativeTo) { return Promise.resolve(moduleId); }

    _loadAndRegister(id) {
        return new Promise((resolve, reject) => {
            try {
                let m = FuseBox.import(id);
                this.moduleRegistry[id] = m;
                resolve(ensureOriginOnExports(m, id));
            } catch (error) {
                reject(error);
            }
        });
    }

    loadModule(id) {
        let existing = this.moduleRegistry[id];
        if (existing) return Promise.resolve(existing);

        if (FuseBox.exists(id)) return this._loadAndRegister(id);

        if (id.indexOf('!') > -1) {
            return this._import(id)
                .then(result => {
                    this.moduleRegistry[id] = result;
                    return ensureOriginOnExports(result, id);
                });
        }

        if (FuseBox.exists(`${PKG_NAME}/${id}`)) {
            return this._loadAndRegister(`${PKG_NAME}/${id}`);
        }

        let moduleId = Object.keys(FuseBox.packages)
            .find(name => id.startsWith(`${name}/`));

        if (moduleId) {
            let resources = Object.keys(FuseBox.packages[moduleId].f);
            let resourceName = id.replace(`${moduleId}/`, '');
            let resourceEntry = resources.find(r => r.endsWith(resourceName + '.js'));
            return this._loadAndRegister(`${moduleId}/${resourceEntry}`);
        }

        throw new Error(`Unable to load module with ID: ${id}`);
    }

    loadAllModules(ids) {
        return Promise.all(
            ids.map(id => this.loadModule(id))
        );
    }

    loadTemplate(url) {
        return this._import(this.applyPluginToUrl(url, TEMPLATE_PLUGIN_NAME));
    }

    _import(address) {
        const [pluginName, id] = address.split('!');
        const plugin = this.loaderPlugins[pluginName];

        return Promise.resolve(plugin.fetch(id));
    }

    loadText(url) {
        return Promise.resolve(FuseBox.import(url))
            .then(m => (typeof m === 'string') ? m : m.default);
    }

    applyPluginToUrl(url, pluginName) {
        return `${pluginName}!${url}`;
    }

    addPlugin(pluginName, implementation) {
        if (this.loaderPlugins[pluginName]) return;
        this.loaderPlugins[pluginName] = implementation;
    }
}

PLATFORM.Loader = FuseBoxLoader;

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
