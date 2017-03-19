import { DOM } from 'aurelia-pal';
import { PLATFORM } from 'aurelia-pal';
import { Loader } from 'aurelia-loader';
import { Origin } from 'aurelia-metadata';

const TEMPLATE_PLUGIN_NAME = 'template-registry-entry';
const PACKAGE_NAME = FuseBox.defaultPackageName || 'default';

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

/**
 * An implementation of the TemplateLoader interface implemented with text-based loading.
 */
export class TextTemplateLoader {
    /**
     * Loads a template.
     * @param loader The loader that is requesting the template load.
     * @param entry The TemplateRegistryEntry to load and populate with a template.
     * @return A promise which resolves when the TemplateRegistryEntry is loaded with a template.
     */
    loadTemplate(loader, entry) {
        return loader.loadText(entry.address)
            .then(text => {
                entry.template = DOM.createTemplateFromMarkup(text);
            });
    }
}

/**
 * An implementation of the Loader abstraction which works with FuseBox.
 */
export class FuseBoxLoader extends Loader {

    /**
     * Creates an instance of the FuseBoxLoader.
     */
    constructor() {
        super();

        this.loaderPlugins = Object.create(null);
        this.moduleRegistry = Object.create(null);
        this.normalizedIds = Object.create(null);

        this.useTemplateLoader(new TextTemplateLoader());
        this.useTemplateRegistryEntryPlugin();
    }

    /**
     * Instructs the loader to use a specific TemplateLoader instance for loading templates
     * @param templateLoader The instance of TemplateLoader to use for loading templates.
     */
    useTemplateLoader(templateLoader) {
        this.templateLoader = templateLoader;
    }

    getTemplateRegistryEntry(address) {
        const entry = this.getOrCreateTemplateRegistryEntry(address);
        if (entry.templateIsLoaded) return entry;
        return this.templateLoader.loadTemplate(this, entry).then(x => entry);
    };

    /**
     * Instructs the loader to use a specific plugin for loading templates
     */
    useTemplateRegistryEntryPlugin() {
        let self = this;
        this.addPlugin(TEMPLATE_PLUGIN_NAME, {
            'fetch': self.getTemplateRegistryEntry.bind(self)
        });
    }

    /**
     * Maps a module id to a source.
     * @param id The module id.
     * @param source The source to map the module to.
     */
    map(id, source) {}

    /**
     * Normalizes a module id.
     * @param moduleId The module id to normalize.
     * @param relativeTo What the module id should be normalized relative to.
     * @return The normalized module id.
     */
    normalizeSync(moduleId, relativeTo) { return moduleId; }

    /**
     * Normalizes a module id.
     * @param moduleId The module id to normalize.
     * @param relativeTo What the module id should be normalized relative to.
     * @return A promise for the normalized module id.
     */
    normalize(moduleId, relativeTo) { return Promise.resolve(moduleId); }

    /**
     * Loads a module with FuseBox and cache it.
     * @param id The module id to load.
     * @return A promise for the loaded module.
     */
    _loadAndCache(id) {
        return new Promise((resolve, reject) => {
            try {
                let moduleId = this._normalizeId(id);
                let _module = FuseBox.import(moduleId);
                this.moduleRegistry[id] = _module;

                resolve(ensureOriginOnExports(_module, id));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Find the module ID for sub-resources
     * @param id the requested module id
     * @param parentId the module id of the package containing sub-resources
     * @returns the module id for the sub-resource
     */
    _getResourceId(id, parentId) {
        const resources = Object.keys(FuseBox.packages[parentId].f);
        const resourceName = id.replace(parentId, '');
        let entry = resources.find(r => r.endsWith(resourceName + '.js'));
        if (!entry) throw new Error(`Unable to find a module with ID: ${id}`);
        return `${parentId}/${entry.replace(/\.js$/i, '')}`;
    }
    // function _getResourceId(id, parentId) {
    //     const parentEntry = FuseBox.packages[parentId].s.entry;
    //     const resourceName = id.replace(parentId, '');
    //     const entry = parentEntry.replace(/\/([^\/]+)\/?$/, resourceName);
    //     return `${parentId}/${entry}`;
    // }


    /**
     * Maps a requested module id to a format that FuseBox Understands
     * @param id the requested module id
     * @returns the normalized id
     */
    _normalizeId(id) {
        let existing = this.normalizedIds[id];
        if (existing) return existing;

        if (FuseBox.exists(id)) {
            this.normalizedIds[id] = id;
            return id;
        }

        let fuseId = `${PACKAGE_NAME}/${id}`;
        if (FuseBox.exists(fuseId)) {
            this.normalizedIds[id] = fuseId;
            return fuseId;
        }

        let parentId = Object.keys(FuseBox.packages)
            .find(name => id.startsWith(`${name}/`));
        if (parentId) {
            let resourceId = this._getResourceId(id, parentId);
            if (FuseBox.exists(resourceId)) {
                this.normalizedIds[id] = resourceId;
                return resourceId;
            }
        }

        throw new Error(`Unable to find a module with ID: ${id}`);
    }

    /**
     * Fetchs a resource using a plugin.
     * @param address The plugin-based module id.
     * @param cache whether to cache the fetched content
     * @return A Promise for fetched content.
     */
    _loadWithPlugin(address, cache) {
        return new Promise((resolve, reject) => {
            const [pluginName, id] = address.split('!');
            const plugin = this.loaderPlugins[pluginName];
            let result = plugin.fetch(id);

            if (!cache) return resolve(result);

            this.moduleRegistry[address] = result;
            resolve(ensureOriginOnExports(result, id));
        });
    }

    /**
     * Loads a module.
     * @param id The module ID to load.
     * @return A Promise for the loaded module.
     */
    loadModule(id) {
        let existing = this.moduleRegistry[id];
        if (existing) {
            return Promise.resolve(existing);
        }

        if (id.indexOf('!') > -1) {
            return this._loadWithPlugin(id, true);
        }

        return this._loadAndCache(id);
    }

    /**
     * Loads a collection of modules.
     * @param ids The set of module ids to load.
     * @return A Promise for an array of loaded modules.
     */
    loadAllModules(ids) {
        return Promise.all(
            ids.map(id => this.loadModule(id))
        );
    }

    /**
     * Loads a template.
     * @param url The url of the template to load.
     * @return A Promise for a TemplateRegistryEntry containing the template.
     */
    loadTemplate(url) {
        return this._loadWithPlugin(this.applyPluginToUrl(url, TEMPLATE_PLUGIN_NAME));
    }

    /**
     * Loads a text-based resource.
     * @param url The url of the text file to load.
     * @return A Promise for text content.
     */
    loadText(url) {
        const id = this._normalizeId(url);

        return Promise.resolve(FuseBox.import(id))
            .then(m => (typeof m === 'string') ? m : m.default);
    }

    /**
     * Alters a module id so that it includes a plugin loader.
     * @param url The url of the module to load.
     * @param pluginName The plugin to apply to the module id.
     * @return The plugin-based module id.
     */
    applyPluginToUrl(url, pluginName) {
        return `${pluginName}!${url}`;
    }

    /**
     * Registers a plugin with the loader.
     * @param pluginName The name of the plugin.
     * @param implementation The plugin implementation.
     */
    addPlugin(pluginName, implementation) {
        if (this.loaderPlugins[pluginName]) return;
        this.loaderPlugins[pluginName] = implementation;
    }
}

PLATFORM.Loader = FuseBoxLoader;

// TODO implement eachModule
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
