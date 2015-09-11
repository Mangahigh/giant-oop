/*global giant */
(function () {
    "use strict";

    module("Properties");

    test("Prefix restriction assertion", function () {
        var v = giant.validators;

        equal(
            v.isAllPrefixed({foo: 'hello', bar: 'world'}, 'f'),
            false,
            "Object properties fail prefix restriction"
        );

        equal(
            v.isAllPrefixed({foo: 'hello', far: 'world'}, 'f'),
            true,
            "Object properties meet prefix restriction"
        );
    });

    test("Accessor validation", function () {
        var v = giant.validators,
            derived = Object.create({});

        derived.get = function () {};

        equal(v.isAccessor(null), false, "Null does not validate");
        equal(v.isAccessor(null), false, "Null does not validate (soft mode)");
        equal(v.isAccessor('a'), false, "Non-object does not validate");
        equal(v.isAccessor({}), false, "Empty object does not validate");
        equal(v.isAccessor({get: 'a'}), false, "Non-function 'get' does not validate");
        equal(v.isAccessor({get: function () {}}), true, "Getter only validates");
        equal(v.isAccessor({set: function () {}}), true, "Setter only validates");
        equal(v.isAccessor({get: function () {}, set: function () {}}), true, "Full accessor validates");
        equal(v.isAccessor({get: function () {}, foo: 'bar'}), false, "Dirty getter fails");
        equal(v.isAccessor(derived), false, "Derived object fails (even w/ valid getter-setter)");
    });

    test("Owner detection", function () {
        var ClassA = giant.Base.extend()
                .addPublic({
                    foo: 'bar'
                })
                .addMethods({
                    init: function () {}
                }),
            ClassB = ClassA.extend()
                .addMethods({
                    hello: function () {return "world";}
                }),
            ClassC = ClassB.extend(),
            instance = ClassC.create();

        equal(typeof giant.Properties.getOwnerOf(instance, 'invalid'), 'undefined');
        strictEqual(giant.Properties.getOwnerOf(instance, 'foo'), ClassA);
        strictEqual(giant.Properties.getOwnerOf(instance, 'init'), ClassA);
        strictEqual(giant.Properties.getOwnerOf(instance, 'hello'), ClassB);
        strictEqual(giant.Properties.getOwnerOf(ClassA, 'foo'), ClassA);
    });

    test("Property descriptor", function () {
        var ClassA = giant.Base.extend()
                .addPublic({
                    foo: 'bar'
                })
                .addMethods({
                    init: function () {}
                }),
            ClassB = ClassA.extend()
                .addMethods({
                    hello: function () {return "world";}
                }),
            ClassC = ClassB.extend(),
            instance = ClassC.create();

        equal(typeof giant.Properties.getPropertyDescriptor(instance, 'invalid'), 'undefined');
        deepEqual(
            giant.Properties.getPropertyDescriptor(instance, 'foo'),
            Object.getOwnPropertyDescriptor(ClassA, 'foo')
        );
        deepEqual(
            giant.Properties.getPropertyDescriptor(instance, 'init'),
            Object.getOwnPropertyDescriptor(ClassA, 'init')
        );
        deepEqual(
            giant.Properties.getPropertyDescriptor(instance, 'hello'),
            Object.getOwnPropertyDescriptor(ClassB, 'hello')
        );
    });

    test("Property names", function () {
        var ClassA = giant.Base.extend()
                .addPublic({
                    foo: 'bar'
                })
                .addMethods({
                    init: function () {}
                }),
            ClassB = ClassA.extend()
                .addPrivateMethods({
                    _hello: function () {return "world";}
                }),
            ClassC = ClassB.extend(),
            instance = ClassC.create();

        deepEqual(
            giant.Properties.getPropertyNames(instance).sort(),
            ["_hello","addConstants","addMethods","addMocks","addPrivate","addPrivateConstants","addPrivateMethods","addPublic","addSurrogate","addTrait","addTraitAndExtend","clearInstanceRegistry","create","elevateMethod","elevateMethods","extend","foo","getBase","getTarget","init","instanceOf","isA","isBaseOf","isMemoized","prepareSurrogates","removeMocks","setInstanceMapper"]
        );
        deepEqual(
            giant.Properties.getPropertyNames(instance, giant.Base).sort(),
            ["_hello","foo","init"]
        );
    });

    test("Property addition", function () {
        var tmp;

        tmp = {};
        giant.Properties.addProperties.call(tmp, {a: 'foo', b: 'bar'}, true, true, true);
        equal(tmp.a, 'foo', "Property added through object");

        raises(function () {
            giant.Properties.addProperties.call(tmp, {a: 'blah'});
        }, "Property name conflict");

            // environments where getters and setters are not available
            // can only work with static getter property descriptors
            tmp = {};
            giant.Properties.addProperties.call(tmp, {a: {get: function () {return this.b;}}, b: 'foo'});
            equal(tmp.a, 'foo', "Property added with getter");

        tmp = {};
        giant.Properties.addProperties.call(tmp, {a: null});
        equal(tmp.a, null, "Null property added");
    });

    test("Flags set", function () {
        var tmp = {},
            descriptor;

        giant.Properties.addProperties.call(tmp, {
                test: function () {}
            },
            true,
            true,
            true
        );

        descriptor = Object.getOwnPropertyDescriptor(tmp, 'test');

        equal(typeof descriptor.value, 'function', "Value type");
        equal(descriptor.writable, true, "Writable");
        equal(descriptor.enumerable, true, "Enumerable");
        equal(descriptor.configurable, true, "Configurable");
    });

    test("Adding traits", function () {
        var hasPropertyAttributes = giant.Feature.hasPropertyAttributes(),
            base = {},
            trait = Object.create(base),
            destination;

        Object.defineProperty(base, 'boo', {
            value       : 'far',
            writable    : false,
            enumerable  : false,
            configurable: false
        });

        Object.defineProperty(trait, 'foo', {
            value       : 'bar',
            writable    : false,
            enumerable  : false,
            configurable: false
        });

        Object.defineProperty(trait, 'init', {
            value       : function () {},
            writable    : false,
            enumerable  : false,
            configurable: false
        });

        destination = Object.create(base);
        giant.Base.addTrait.call(destination, trait);

        ok(!destination.hasOwnProperty('init'), "Init was not copied over");
        ok(destination.hasOwnProperty('foo'), "Regular property gets copied over");
        deepEqual(
            Object.getOwnPropertyDescriptor(destination, 'foo'),
            {
                value       : 'bar',
                writable    : !hasPropertyAttributes,
                enumerable  : !hasPropertyAttributes,
                configurable: !hasPropertyAttributes
            },
            "Property added as trait"
        );

        raises(function () {
            giant.Base.addTrait.call(destination, trait);
        }, "Re-adding trait causes collision");

        giant.testing = true;

        destination = Object.create(base);
        giant.Base.addTrait.call(destination, trait);

        deepEqual(
            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(destination), 'boo'),
            {
                value       : 'far',
                writable    : !hasPropertyAttributes,
                enumerable  : !hasPropertyAttributes,
                configurable: !hasPropertyAttributes
            },
            "Trait in testing mode"
        );

        giant.testing = false;
    });

    test("Trait integration", function () {
        expect(4);

        var TraitBase = giant.Base.extend()
                .addPrivateMethods({
                    _hello: function () {
                        ok(true, "Private method called");
                    }
                })
                .addMethods({
                    foo: function () {
                        ok(true, "Base method called");
                    }
                }),
            TraitChild = TraitBase.extend()
                .addMethods({
                    foo: function () {
                        TraitBase.foo.call(this);
                    }
                }),
            MyClass = giant.Base.extend()
                .addTrait(TraitChild)
                .addMethods({
                    init: function () {}
                }),
            myInstance = MyClass.create();

        strictEqual(myInstance._hello, TraitBase._hello);
        strictEqual(myInstance.foo, TraitChild.foo);

        myInstance._hello();
        myInstance.foo();
    });

    test("Trait & extend", function () {
        expect(2);

        giant.testing = true;

        var BaseClass = giant.Base.extend(),
            HostClass = BaseClass.extend(),
            MyTrait = giant.Base.extend();

        BaseClass.addMocks({
            addTrait: function (trait) {
                strictEqual(trait, MyTrait, "Trait to be added");
                return this;
            },

            extend: function () {
                ok(true, "Extend called");
            }
        });

        HostClass.addTraitAndExtend(MyTrait);

        BaseClass.removeMocks();

        giant.testing = false;
    });

    test("Adding methods", function () {
        var tmp = {},
            result;

        result = giant.Base.addMethods.call(tmp, {
            foo: function () { return 'foo'; }
        });

        equal(result, tmp, "addMethods returns input object");
        equal(typeof result.foo, 'function', "Method added");
        equal(result.foo(), 'foo', "Method invoked");
    });

    test("Overriding built-in methods", function () {
        var tmp = {},
            delta = {
                toString: function () {
                    return 'foo';
                }
            };

        ok(delta.hasOwnProperty('toString'), "Override on object literal");
        equal(delta.toString(), 'foo', "Serialization invoked");
        equal(tmp.toString(), '[object Object]', "Built-in serializer");

        giant.Base.addMethods.call(tmp, delta);

        equal(typeof tmp.toString, 'function', "Override added");
        equal(tmp.toString(), 'foo', "Serialization invoked");
    });

    test("Flags not set", function () {
        var hasPropertyAttributes = giant.Feature.hasPropertyAttributes(),
            tmp = {},
            descriptor;

        giant.Properties.addProperties.call(tmp, {
            test: function () {}
        });

        descriptor = Object.getOwnPropertyDescriptor(tmp, 'test');

        equal(typeof descriptor.value, 'function', "Value type");
        equal(descriptor.writable, !hasPropertyAttributes, "Writable");
        equal(descriptor.enumerable, !hasPropertyAttributes, "Enumerable");
        equal(descriptor.configurable, !hasPropertyAttributes, "Configurable");
    });

    test("Messy", function () {
        giant.messy = true;

        var hasPropertyAttributes = giant.Feature.hasPropertyAttributes(),
            tmp = {},
            descriptor;

        giant.Properties.addProperties.call(tmp, {
            test: function () {}
        }, false, false, false);

        descriptor = Object.getOwnPropertyDescriptor(tmp, 'test');

        equal(typeof descriptor.value, 'function', "Value type");
        equal(descriptor.writable, true, "Writable");
        equal(descriptor.enumerable, !hasPropertyAttributes, "Enumerable");
        equal(descriptor.configurable, !hasPropertyAttributes, "Configurable");

        giant.messy = false;
    });

    test("Class assembly", function () {
        var tmp = {};

        function testMethod() {}

        giant.Base.addMethods.call(tmp, {
            test: testMethod
        });

        giant.Base.addConstants.call(tmp, {
            foo: "foo"
        });

        raises(function () {
            giant.Base.addPrivate.call(tmp, {
                bar: "bar"
            });
        }, "Invalid private property");

        deepEqual(
            tmp,
            {
                test: testMethod,
                foo : "foo"
            },
            "Enumerable properties of class"
        );
    });

    test("Method elevation", function () {
        var base = giant.Base.extend()
                .addMethods({test: function () {return this;}}),
            instance = Object.create(base);

        equal(instance.test, base.test, "Instance method same as class method");
        giant.Base.elevateMethod.call(instance, 'test');
        notEqual(instance.test, base.test, "Instance method differs from class method");

        var test = instance.test;
        equal(test(), instance, "Instance method tied to instance");
    });

    test("Multiple method elevation", function () {
        var base = giant.Base.extend()
                .addMethods({
                    foo: function () {return this;},
                    bar: function () {return this;}
                }),
            instance = Object.create(base);

        giant.Base.elevateMethods.call(instance, 'foo', 'bar');
        notEqual(instance.foo, base.foo, "should set instance level method (first)");
        notEqual(instance.bar, base.bar, "should set instance level method (second)");
    });

    test("Mocks", function () {
        var tmp = {};

        function testMethod() {}

        raises(function () {
            giant.Base.addMocks.call(tmp, {
                foo: testMethod
            });
        }, "Testing is not on");

        giant.testing = true;

        giant.Base.addMocks.call(tmp, {
            foo: testMethod
        });

        giant.testing = false;

        deepEqual(tmp, {
            foo: testMethod
        }, "Mock method added");

        giant.Base.removeMocks.call(tmp);

        deepEqual(tmp, {}, "Mock methods removed");
    });
}());
