//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="../lib/jquery.d.ts" />
/// <reference path="common.ts" />
/// <reference path="config.ts" />
/// <reference path="item.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {

    export interface View {

        //constructor(config: Config, main_div: JQuery, item: Item);

        load(): void;
        updateLayout(): void;
        goToNext(): void;
        goToPrev(): void;
        onKeydown(ev): bool;

        onLoadPath: Signal;
        onPageUpdate: Signal;
        onReady: Signal;
        //onPathChanged: Signal;

    }

} // module Exposition