/**
 * inspired by: http://trac.osgeo.org/openlayers/ticket/1715
 *
 *
 * based on: http://raphaeljs.com/graffle.html
 *
 *      Copyright © 2008 Dmitry Baranovskiy
 *
 *      Permission is hereby granted, free of charge, to any person obtaining a
 *      copy of this software and associated documentation files (the “Software”),
 *      to deal in the Software without restriction, including without limitation
 *      the rights to use, copy, modify, merge, publish, distribute, sublicense,
 *      and/or sell copies of the Software, and to permit persons to whom the Software
 *      is furnished to do so, subject to the following conditions:
 *
 *      The above copyright notice and this permission notice shall be included in all
 *      copies or substantial portions of the Software.
 *
 *      THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *      INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 *      PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 *      HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 *      OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


/**
 * @requires OpenLayers/Geometry/Curve.js
 */

/**
 * Class: OpenLayers.Geometry.CubicCurve
 * A CubicCurve is a Curve which, once two points have been added to it, can
 * never be less than two points long.
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.Curve>
 */
OpenLayers.Geometry.CubicCurve = OpenLayers.Class(OpenLayers.Geometry.Curve, {
    pixel: [],
    directed: true,
    tolerance: 20,
    offset: 5,
    startPosition: 0.25,
    endPosition: 0.75,

    /**
     * Constructor: OpenLayers.Geometry.CubicCurve
     * Create a new CubicCurve geometry
     *
     * Parameters:
     * points - {Array(<OpenLayers.Geometry.Point>)} An array of points used to
     *          generate the curve
     *
     */
    initialize: function() {
        OpenLayers.Geometry.Curve.prototype.initialize.apply(this, null);
    },

    _adjustConnectionPoints: function(a, value, add) {
        if (add) {
            a[0].y -= value;
            a[1].y += value;
            a[2].x -= value;
            a[3].x += value;
            a[4].y -= value;
            a[5].y += value;
            a[6].x -= value;
            a[7].x += value;
        } else {
            a[0].y += value;
            a[1].y -= value;
            a[2].x += value;
            a[3].x -= value;
            a[4].y += value;
            a[5].y -= value;
            a[6].x += value;
            a[7].x -= value;
        }
    },

    calculatePixels: function(bb1, bb2) {
        if (bb1 && bb2) {
            var p = [{x: bb1.x + bb1.offset_x + bb1.width * this.startPosition,
                      y: bb1.y + bb1.offset_y },                                    /* NORTH 1 */
                     {x: bb1.x + bb1.offset_x + bb1.width * (1 - this.startPosition),
                      y: bb1.y + bb1.offset_y + bb1.height },                       /* SOUTH 1 */
                     {x: bb1.x + bb1.offset_x,
                      y: bb1.y + bb1.offset_y + bb1.height * (1 - this.startPosition) },    /* WEST  1 */
                     {x: bb1.x + bb1.offset_x + bb1.width,
                      y: bb1.y + bb1.offset_y + bb1.height * this.startPosition},   /* EAST  1 */

                     {x: bb2.x + bb2.offset_x + bb2.width * this.endPosition,
                      y: bb2.y + bb2.offset_y },                                /* NORTH 2 */
                     {x: bb2.x + bb2.offset_x + bb2.width * (1 - this.endPosition),
                      y: bb2.y + bb2.offset_y + bb2.height },                   /* SOUTH 2 */
                     {x: bb2.x + bb2.offset_x,
                      y: bb2.y + bb2.offset_y + bb2.height * (1 - this.endPosition)},   /* WEST  2 */
                     {x: bb2.x + bb2.offset_x + bb2.width,
                      y: bb2.y + bb2.offset_y + bb2.height * this.endPosition}, /* EAST  2 */
                    ];
            this._adjustConnectionPoints(p, this.offset, true); // distanz for connection line

            this._adjustConnectionPoints(p, this.tolerance, true); // additional distanz for better connection selection
            /* distances between objects and according coordinates connection */
            var d = {}, dis = [];
            /*
             * find out the best connection coordinates by trying all possible ways
             */
            /* loop the first object's connection coordinates */
            for (var i = 0; i < 4; i++) {
                /* loop the second object's connection coordinates */
                for (var j = 4; j < 8; j++) {
                    var dx = Math.abs(p[i].x - p[j].x),
                        dy = Math.abs(p[i].y - p[j].y);
                    if ((i == j - 4) ||
                        (((i != 3 && j != 6) || p[i].x < p[j].x) &&
                         ((i != 2 && j != 7) || p[i].x > p[j].x) &&
                         ((i != 0 && j != 5) || p[i].y > p[j].y) &&
                         ((i != 1 && j != 4) || p[i].y < p[j].y)
                        )
                       ) {
                        dis.push(dx + dy);
                        d[dis[dis.length - 1].toFixed(0)] = [i, j];
                    }
                }
            }
            var res = dis.length == 0 ? [0, 4] : d[Math.min.apply(Math, dis).toFixed(0)];
            this._adjustConnectionPoints(p, this.tolerance, false); // remove additional distanz

            /* bezier path */
            var dx, dy;
            this.pixel[0] = new OpenLayers.Pixel(p[res[0]].x, p[res[0]].y);
            this.pixel[3] = new OpenLayers.Pixel(p[res[1]].x, p[res[1]].y);
            dx = Math.max(Math.abs(this.pixel[0].x - this.pixel[3].x) / 2, 10);
            dy = Math.max(Math.abs(this.pixel[0].y - this.pixel[3].y) / 2, 10);
            this.pixel[1] = new OpenLayers.Pixel([this.pixel[0].x, this.pixel[0].x, this.pixel[0].x - dx, this.pixel[0].x + dx][res[0]],
                                                 [this.pixel[0].y - dy, this.pixel[0].y + dy, this.pixel[0].y, this.pixel[0].y][res[0]]);
            this.pixel[2] = new OpenLayers.Pixel([0, 0, 0, 0, this.pixel[3].x, this.pixel[3].x, this.pixel[3].x - dx, this.pixel[3].x + dx][res[1]],
                                                 [0, 0, 0, 0, this.pixel[0].y + dy, this.pixel[0].y - dy, this.pixel[3].y, this.pixel[3].y][res[1]]);

            // arrow
            if (this.directed) {
                /* magnitude, length of the last path vector */
                var mag = Math.sqrt((this.pixel[3].y - this.pixel[2].y) * (this.pixel[3].y - this.pixel[2].y) + (this.pixel[3].x - this.pixel[2].x) * (this.pixel[3].x - this.pixel[2].x));

                /* vector normalisation to specified length  */
                var norm = function(x,l){return (-x*(l||5)/mag);};

                /* calculate coordinates (two lines orthogonal to the path vector) */
                this.pixel[4] = new OpenLayers.Pixel((norm(this.pixel[3].x-this.pixel[2].x)+norm(this.pixel[3].y-this.pixel[2].y)+this.pixel[3].x).toFixed(3),
                                                     (norm(this.pixel[3].y-this.pixel[2].y)+norm(this.pixel[3].x-this.pixel[2].x)+this.pixel[3].y).toFixed(3));
                this.pixel[5] = new OpenLayers.Pixel((norm(this.pixel[3].x-this.pixel[2].x)-norm(this.pixel[3].y-this.pixel[2].y)+this.pixel[3].x).toFixed(3),
                                                     (norm(this.pixel[3].y-this.pixel[2].y)-norm(this.pixel[3].x-this.pixel[2].x)+this.pixel[3].y).toFixed(3));
            }
        }
    },

    updateComponents: function(map) {
        if (map && map.CLASS_NAME == "OpenLayers.Map") {
            // get Position onMap
            var p1, p2, p3, p4, p5;
            p1 = map.getLonLatFromPixel(this.pixel[0]);
            p2 = map.getLonLatFromPixel(this.pixel[1]);
            p3 = map.getLonLatFromPixel(this.pixel[2]);
            p4 = map.getLonLatFromPixel(this.pixel[3]);
            if (this.directed) {
                p5 = map.getLonLatFromPixel(this.pixel[4]);
                p6 = map.getLonLatFromPixel(this.pixel[5]);
            }

            // add/update components
            this.components[0] = new OpenLayers.Geometry.Point(p1.lon.toFixed(3), p1.lat.toFixed(3));
            this.components[1] = new OpenLayers.Geometry.Point(p2.lon.toFixed(3), p2.lat.toFixed(3));
            this.components[2] = new OpenLayers.Geometry.Point(p3.lon.toFixed(3), p3.lat.toFixed(3));
            this.components[3] = new OpenLayers.Geometry.Point(p4.lon.toFixed(3), p4.lat.toFixed(3));
            if (this.directed) {
                this.components[4] = new OpenLayers.Geometry.Point(p5.lon.toFixed(3), p5.lat.toFixed(3));
                this.components[5] = new OpenLayers.Geometry.Point(p6.lon.toFixed(3), p6.lat.toFixed(3));
            }
        }
    },

    /**
     * APIMethod: removeComponent
     * Only allows removal of a point if there are four or more (base + control) points in
     * the curve. (otherwise the result would be just a single point)
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>} The point to be removed
     */
    removeComponent: function(point) {
        if ( this.components && (this.components.length > 4)) {
            OpenLayers.Geometry.Collection.prototype.removeComponent.apply(this,
                                                                  arguments);
        }
    },

    /* FIX ME: intersection maybe not correct yet */
    /**
     * APIMethod: intersects
     * Test for instersection between two geometries.  This is a cheapo
     *     implementation of the Bently-Ottmann algorigithm.  It doesn't
     *     really keep track of a sweep line data structure.  It is closer
     *     to the brute force method, except that segments are sorted and
     *     potential intersections are only calculated when bounding boxes
     *     intersect.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Returns:
     * {Boolean} The input geometry intersects this geometry.
     */
    intersects: function(geometry) {
        var intersect = false;
        var type = geometry.CLASS_NAME;
        if(type == "OpenLayers.Geometry.LineString" ||
           type == "OpenLayers.Geometry.LinearRing" ||
           type == "OpenLayers.Geometry.Point") {
            var segs1 = this.getSortedSegments();
            var segs2;
            if(type == "OpenLayers.Geometry.Point") {
                segs2 = [{
                    x1: geometry.x, y1: geometry.y,
                    x2: geometry.x, y2: geometry.y
                }];
            } else {
                segs2 = geometry.getSortedSegments();
            }
            var seg1, seg1x1, seg1x2, seg1y1, seg1y2,
                seg2, seg2y1, seg2y2;
            // sweep right
            outer: for(var i=0; i<segs1.length; ++i) {
                seg1 = segs1[i];
                seg1x1 = seg1.x1;
                seg1x2 = seg1.x2;
                seg1y1 = seg1.y1;
                seg1y2 = seg1.y2;
                inner: for(var j=0; j<segs2.length; ++j) {
                    seg2 = segs2[j];
                    if(seg2.x1 > seg1x2) {
                        // seg1 still left of seg2
                        break;
                    }
                    if(seg2.x2 < seg1x1) {
                        // seg2 still left of seg1
                        continue;
                    }
                    seg2y1 = seg2.y1;
                    seg2y2 = seg2.y2;
                    if(Math.min(seg2y1, seg2y2) > Math.max(seg1y1, seg1y2)) {
                        // seg2 above seg1
                        continue;
                    }
                    if(Math.max(seg2y1, seg2y2) < Math.min(seg1y1, seg1y2)) {
                        // seg2 below seg1
                        continue;
                    }
                    if(OpenLayers.Geometry.segmentsIntersect(seg1, seg2)) {
                        intersect = true;
                        break outer;
                    }
                }
            }
        } else {
            intersect = geometry.intersects(this);
        }
        return intersect;
    },

    /**
     * Method: getSortedSegments
     *
     * Returns:
     * {Array} An array of segment objects.  Segment objects have properties
     *     x1, y1, x2, and y2.  The start point is represented by x1 and y1.
     *     The end point is represented by x2 and y2.  Start and end are
     *     ordered so that x1 < x2.
     */
    getSortedSegments: function() {
        var numSeg = this.components.length - 1;
        var segments = new Array(numSeg);
        for(var i=0; i<numSeg; ++i) {
            point1 = this.components[i];
            point2 = this.components[i + 1];
            if(point1.x < point2.x) {
                segments[i] = {
                    x1: point1.x,
                    y1: point1.y,
                    x2: point2.x,
                    y2: point2.y
                };
            } else {
                segments[i] = {
                    x1: point2.x,
                    y1: point2.y,
                    x2: point1.x,
                    y2: point1.y
                };
            }
        }
        // more efficient to define this somewhere static
        function byX1(seg1, seg2) {
            return seg1.x1 - seg2.x1;
        }
        return segments.sort(byX1);
    },

    CLASS_NAME: "OpenLayers.Geometry.CubicCurve"
});
