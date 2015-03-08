/*global troop, module, test, ok, equal, deepEqual, expect, raises */
var globalNs = {};

(function () {
    "use strict";

    module("Surrogate");

    test("Finding surrogate", function () {
        var ns = {};

        ns.base = troop.Base.extend()
            .addSurrogate(ns, 'child', function (test) {
                ok("Filter triggered");
                if (test === 'test') {
                    return true;
                }
            });

        ns.child = ns.base.extend();

        equal(troop.Surrogate.getSurrogate.call(ns.base, 'test'), ns.child, "Arguments fit surrogate");
        equal(troop.Surrogate.getSurrogate.call(ns.base, 'blah'), ns.base, "Arguments don't fit a surrogate");
    });

    test("Surrogate preparation", function () {
        expect(3);

        var base = troop.Base.extend()
                .addMethods({
                    init: function (bar) {
                        equal(arguments.length, 1, "Original argument list passed to init");
                    }
                }),
            child = base.extend(),
            ns = {
                base : base,
                child: child
            };

        base
            .prepareSurrogates(function (bar) {
                return [bar, 'foo'];
            })
            .addSurrogate(ns, 'child', function (bar, extry) {
                equal(extry, 'foo', "Preparation handler result added");
                equal(bar, 'bar', "Constructor argument ok");
                return bar === 'bar';
            });

        base.create('bar');
    });

    test("Surrogate addition", function () {
        var filter = function () {},
            base = troop.Base.extend()
                .addMethods({
                    init: function () {}
                }),
            child = base.extend()
                .addMethods({
                    init: function () {}
                }),
            ns = {
                base : base,
                child: child
            };

        globalNs.child = child;

        ok(!base.hasOwnProperty('surrogates'), "Class doesn't have surrogates");

        base.addSurrogate(ns, 'child', filter);

        equal(base.surrogateInfo.descriptors.length, 1, "New number of surrogates");

        deepEqual(
            base.surrogateInfo.descriptors,
            [
                {
                    namespace: ns,
                    className: 'child',
                    filter   : filter
                }
            ],
            "Surrogate info"
        );
    });
}());