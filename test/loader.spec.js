import './setup';
import { FuseBoxLoader } from '../src/index';

describe('FuseBox Loader', () => {
    describe('Instance method', () => {
        let loader;
        beforeEach(() => {
            loader = new FuseBoxLoader();
        });

        describe('loadModule', () => {
            it('should load a module', (done) => {
                loader.loadModule('./test/fixtures/base-module')
                    .then((result) => {
                        expect(result).toEqual(jasmine.any(Object));
                        expect(result.default).toEqual(jasmine.any(Function));
                        expect(result.default()).toEqual('baseModule hello');
                    })
                    .catch((reason) => expect(false).toBeTruthy(reason))
                    .then(done);
            });

            it('should fail if the module doesn\'t exist', (done) => {
                loader.loadModule('notHere')
                    .then((result) => expect(false).toBeTruthy('Not Found'))
                    .catch((reason) => expect(reason).toEqual(jasmine.any(Error)))
                    .then(done);
            });

            it('should cache any repeated module calls', (done) => {
                const id = './test/fixtures/base-module';
                let importSpy = spyOn(FuseBox, 'import').and.callThrough();

                loader.loadModule(id)
                    .then(() => {
                        return loader.loadModule(id).then(() => {
                            expect(importSpy.calls.count()).toEqual(1);
                        });
                    })
                    .catch((reason) => expect(false).toBeTruthy(reason))
                    .then(done);
            });
        });

        describe('loadAllModules()', () => {
            it('will return when all modules are loaded', (done) => {
                const modules = [
                    './test/fixtures/base-module',
                    './test/fixtures/modules/second-module',
                ];

                loader.loadAllModules(modules)
                    .then((results) => {
                        expect(results.length).toBe(2);
                        for (let result of results) {
                            expect(result).toEqual(jasmine.any(Object));
                            expect(result.default).toEqual(jasmine.any(Function));
                            expect(result.default()).toEqual(jasmine.any(String));
                        }
                    })
                    .catch((reason) => expect(false).toBeTruthy(reason))
                    .then(done);
            });

            it('will fail if any modules fail to load', (done) => {
                loader.loadAllModules(['./test/fixtures/base-module', 'doesntExist'])
                    .then(() => expect(false).toBeTruthy('No Modules loaded'))
                    .catch((reason) => expect(reason).toEqual(jasmine.any(Error)))
                    .then(done);
            });
        });

        describe('loadTemplate()', () => {
            it('will load a template', (done) => {
                loader.loadTemplate('./test/fixtures/base-template.html')
                    .then((result) => {
                        expect(result.template.innerHTML.trim())
                            .toBe('<h1>I am a template</h1>');
                    })
                    .catch((reason) => expect(false).toBeTruthy(reason))
                    .then(done);
            });

            it('should fail when a template doesn\'t exist', (done) => {
                loader.loadTemplate('./test/fixtures/base-template2.html')
                    .then((result) => expect(false).toBeTruthy('Not Found'))
                    .catch((reason) => expect(reason).toEqual(jasmine.any(Error)))
                    .then(done);
            });
        });
    });
});
