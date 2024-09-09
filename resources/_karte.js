/*!
* @_speicherkarte.js - Anki Flashcard Maker for German Learning
* @version 0.0.1
* https://deutsch.tools
*
* @license MIT
*/

var colors = ({
    'black': '#000000',
    'green': '#6ca877',
    'purple': '#805695',
    'yellow': '#e89959',
    'red': '#e06262',
    'gray': '#c7c1bc',
});
var maxFontSize = 13;

function drawShape(draw, options, offset) {
    const flower = (r, b) => {
        var o = r;
        var a = Math.PI / 6; // 30 degrees
        var a2p = (alpha, radius, offset) => {
            return [Math.cos(alpha) * radius + offset, Math.sin(alpha) * radius + offset];
        }
        var pa2p = (point, alpha, radius) => {
            return [point[0] + radius * Math.cos(alpha), point[1] + radius * Math.sin(alpha)];
        }
        var path = `M ${a2p(0, r, o)[0]} ${a2p(0, r, o)[1]}`;
        for (var N = 0; N < 6; N += 1) {
            var A = a2p(N * 2 * a, r, o);
            var A_ = pa2p(A, N * 2 * a + 3 * a, 0.28 * r);
            var B = a2p(N * 2 * a + a, r - b, o);
            var B1 = pa2p(B, N * 2 * a + a - 3 * a, 0.12 * r)
            var B2 = pa2p(B, N * 2 * a + a + 3 * a, 0.12 * r)
            var C = a2p((N + 1) * 2 * a, r, o);
            var C_ = pa2p(C, N * 2 * a - a, 0.28 * r);
            path += `
        C ${A_[0]} ${A_[1]},
          ${B1[0]} ${B1[1]},
          ${B[0]} ${B[1]}
        C ${B2[0]} ${B2[1]},
          ${C_[0]} ${C_[1]},
          ${C[0]} ${C[1]} `;
        }
        return path;
    }

    const cr = 0.3; // coaxial ratio

    var { shape, size, color, fill, pattern, border, clock, pill, hook, sidepill } = options

    var g = draw.group();
    g.attr('class', 'shape');
    var s, ss; // ss: coaxial shapes
    switch (shape) {
        case 'square':
            var [a] = size;
            s = draw.rect(a, a);
            if (fill == 'large' || fill == 'mid' || fill == 'small') {
                var ss = draw.rect(a, a).scale(0.7).stroke({ 'width': border });
                ss.fill(fill == 'small' ? 'none' : colors[color]);
            }
            break;
        case 'circle':
            var [d] = size;
            var r = d / 2;
            s = draw.circle(2 * r);
            if (sidepill) {
                var gg = drawShape(draw, {
                    ...options,
                    shape: 'sidepill'
                }, [
                    -r,
                    0,
                ]);
                ss = gg.shape;
            }
            break;
        case 'diamond':
            var [a, b] = size;
            var path = `0,${b / 2} ${a / 2},0 ${a},${b / 2}, ${a / 2},${b}`;
            s = draw.polygon(path);
            if (fill == 'large' || fill == 'mid' || fill == 'small') {
                var ss = draw.polygon(path).scale(0.7).stroke({ 'width': border });
                ss.fill(fill == 'small' ? 'none' : colors[color]);
            }
            break;
        case 'triangle':
            var [a, h] = size;
            var path = `0,${h / 2} ${a},0 ${a},${h}`;
            s = draw.polygon(path);
            if (fill == 'large' || fill == 'mid' || fill == 'small') {
                var ss = draw.polygon(path).scale(0.6).stroke({ 'width': border });
                ss.fill(fill == 'small' ? 'none' : colors[color]);
                ss.translate(0.1 * h, 0);
            }
            break;
        case 'olive':
            var [a, b] = size;
            var r = (a * a + b * b) / 4 / b;
            var path = `M0,${b / 2} A ${r} ${r} 0 0 1 ${a},${b / 2} M0,${b / 2} A ${r} ${r} 0 0 0 ${a},${b / 2}`;
            s = draw.path(path);
            if (fill == 'large' || fill == 'mid' || fill == 'small') {
                var ss = draw.path(path).scale(0.7).stroke({ 'width': border });
                ss.fill(fill == 'small' ? 'none' : colors[color]);
            }
            break;
        case 'pill':
            var [a, r] = size;
            s = draw.rect(a, r * 2).radius(r);

            if (pill) {
                if (pill.shape != 'neutral') {
                    var size = pill.type == 'out' ? [2 * r, 2 * r] : [1.5 * r, 1.5 * r];
                    var o = pill.type == 'out' ? [a - 2 * r, 0] : [0.95 * a - 1.5 * r, 0.25 * r];
                    if (pill.shape == 'triangle' || pill.shape == 'olive') {
                        size[1] *= 0.8;
                        o[1] += 0.1 * r;
                    }
                    if (pill.type == 'out' && pill.shape != 'triangle') {
                        o[0] += 0.5 * r;
                    }
                    var gg = drawShape(draw, {
                        ...pill,
                        size
                    }, [
                        o[0],
                        o[1],
                    ]);
                    ss = gg.shape
                }
                else {
                    var c = Math.cos(Math.PI / 3);
                    var n = Math.sin(Math.PI / 3);
                    var l = a / 8;
                    var t = r / 1.5;
                    var path = `
              M ${l},${r} L ${l},${r} ${l + t * c},${r + t * n}
              M ${l},${r} L ${l},${r} ${l + t * c},${r - t * n}
              M ${a - l},${r} L ${a - l},${r} ${a - l - t * c},${r + t * n}
              M ${a - l},${r} L ${a - l},${r} ${a - l - t * c},${r - t * n}
          `;
                    ss = draw.path(path).stroke({ width: border });
                }
            }
            break;
        case 'flower':
            var [d, b] = size;
            var r = d / 2;
            var path = flower(r, b);
            s = draw.path(path);

            if (fill == 'thin' || fill == 'thick') {
                var c = draw.mask().add(draw.path(path).fill('white'));
                c.add(draw.path(path).scale(fill == 'thin' ? 0.75 : 0.6).fill('black'));
                s.maskWith(c);
            }

            if (sidepill) {
                var gg = drawShape(draw, {
                    ...options,
                    shape: 'sidepill'
                }, [
                    -r,
                    0,
                ]);
                ss = gg.shape;
            }

            break;
        case 'hook':
            var [a] = size;
            switch (hook.type) {
                case 'middle':
                    s = draw.path(`M 0,${a / 2} L 0,${a / 2} ${a / 3},${a / 2} A ${a / 6} ${a / 6} 0 0 0 ${a / 3 * 2},${a / 2} L ${a / 3 * 2},${a / 2} ${a},${a / 2}`);
                    break;
                case 'left':
                    s = draw.path(`M 0,${a / 2} A ${a / 6} ${a / 6} 0 0 0 ${a / 3},${a / 2} L ${a / 3},${a / 2} ${a},${a / 2}`);
                    break;
                case 'right':
                    s = draw.path(`M 0,${a / 2} L 0,${a / 2} ${a / 3 * 2},${a / 2}  A ${a / 6} ${a / 6} 0 0 0 ${a},${a / 2}`);
                    break;
                case 'circle':
                    s = draw.path(`M 0,${a / 2} A ${a / 4} ${a / 4} 0 0 0 ${a / 2},${a / 2} M 0,${a / 2} A ${a / 4} ${a / 4} 0 0 1 ${a / 2},${a / 2} L ${a / 2},${a / 2} ${a},${a / 2}`);
                    break;
            }
            break;
        case 'clock':
            var [d, b] = size;
            var r = d / 2;
            if (clock.shape == 'circle') {
                s = draw.circle(r * 2);
            } else {
                var path = flower(r, b);
                var pp = draw.path(path);
                if (fill == 'thin' || fill == 'thick') {
                    var c = draw.mask().add(draw.path(path).fill('white'));
                    c.add(draw.path(path).scale(fill == 'thin' ? 0.75 : 0.6).fill('black'));
                    pp.maskWith(c);
                }
                s = pp;
            }

            var w = r * 0.25;
            var h = r * 0.8;
            ss = draw.group();
            switch (clock.type) {
                case 'simple':
                    ss.add(draw.rect(w, h).translate(r - w / 2, -r * 0.1).fill('black'));
                    break;
                case 'hollow':
                    ss.add(draw.rect(w, h).translate(r - w / 2, -r * 0.1).fill({ color: colors[color] }).stroke({ width: 1 }));
                    break;
                case 'double':
                    ss.add(draw.rect(w, h).translate(r - w / 2 - 0.85 * w, -r * 0.1).fill({ color: colors[color] }).stroke({ width: 1 }));
                    ss.add(draw.rect(w, h).translate(r - w / 2 + 0.85 * w, -r * 0.1).fill({ color: colors[color] }).stroke({ width: 1 }));
                    break;
                case 'dot':
                    ss.add(draw.rect(w, h).translate(r - w / 2, -r * 0.1).fill('black'));
                    ss.add(draw.circle(w).translate(r - w / 2, r - w / 2).fill('black'));
                    break;
            }

            break;
        case 'asterisk':
            var [a] = size;
            var tc = Math.cos(Math.PI / 3) * a / 2;
            var ts = Math.sin(Math.PI / 3) * a / 2;
            s = draw.path(`
        M 0,${a / 2} L 0,${a / 2} ${a},${a / 2}
        M ${a / 2 - tc},${a / 2 - ts} L ${a / 2 - tc},${a / 2 - ts} ${a / 2 + tc},${a / 2 + ts}
        M ${a / 2 - tc},${a / 2 + ts} L ${a / 2 - tc},${a / 2 + ts} ${a / 2 + tc},${a / 2 - ts}
      `);
            break;
        case 'sidepill':
            var [d, b] = size;
            var r = d / 2;
            s = draw.rect(r * 2, r).radius(r / 2).translate(0, r / 2);

            var c = draw.mask().add(draw.rect(r * 1.5, r).radius(r / 2).fill('white'));
            if (sidepill.shape == 'circle') {
                c.add(draw.circle(d).translate(r - 0.1 * r, r / 2 - d / 2).scale(1.1).fill('black'));

            } else if (sidepill.shape == 'flower') {
                var path = flower(r, b);
                c.add(draw.path(path).translate(r - 0.1 * r, r / 2 - d / 2).scale(1.1).fill('black'));
            }
            s.maskWith(c);
            break;
        default:
            s = null;
            break;
    }

    if (!s) return;

    switch (fill) {
        case 'full':
        case 'thin':
        case 'thick':
        case 'large':
            s.fill(colors[color]);
            break;
        case 'none':
        case 'mid':
        case 'small':
            s.fill('none');
            break;
        case 'half':
            if (shape == 'square') {
                var [r] = size;
                s.fill('none');
                g.add(draw.rect(r - border, r / 2 - border / 2).translate(border / 2, r / 2).fill(colors[color]));
            }
            break;
    }

    s.stroke({ width: border === undefined ? 0 : border });
    g.add(s);

    g.translate(offset[0], offset[1]);
    if (sidepill && ['circle', 'flower'].includes(shape)) {
        g.translate(offset[0] + size[0] / 4);
    }

    if (ss) {
        g.add(ss);
    }

    if (shape == 'clock' && clock.rotate !== undefined) {
        g.rotate(clock.rotate, size[0] / 2, size[0] / 2)
    }

    // vert, diag
    if (pattern == 'vert') {
        var p, c;
        switch (shape) {
            case 'circle':
                var [d] = size;
                var r = d / 2;
                c = draw.clip().add(draw.circle(2 * r));
                p = draw.path(`
          M ${r * 2 / 4},0 L ${r * 2 / 4},0 ${r * 2 / 4},${2 * r}
          M ${r * 2 / 4 * 2},0 L ${r * 2 / 4 * 2},0 ${r * 2 / 4 * 2},${2 * r}
          M ${r * 2 / 4 * 3},0 L ${r * 2 / 4 * 3},0 ${r * 2 / 4 * 3},${2 * r}
        `).fill('none').stroke({ width: border !== undefined ? border : 1 });
                break;
            case 'flower':
                var [d, b] = size;
                var r = d / 2;
                c = draw.clip().add(draw.path(flower(r, b)));
                p = draw.path(`
          M ${r * 2 / 4},0 L ${r * 2 / 4},0 ${r * 2 / 4},${2 * r}
          M ${r * 2 / 4 * 2},0 L ${r * 2 / 4 * 2},0 ${r * 2 / 4 * 2},${2 * r}
          M ${r * 2 / 4 * 3},0 L ${r * 2 / 4 * 3},0 ${r * 2 / 4 * 3},${2 * r}
        `).fill('none').stroke({ width: border !== undefined ? border : 1 });
                break;
            case 'square':
                var [a] = size;
                c = draw.clip().add(draw.rect(a, a));
                p = draw.path(`
          M ${a / 3},0 L ${a / 3},0 ${a / 3},${a * 2}
          M ${a / 3 * 2},0 L ${a / 3 * 2},0 ${a / 3 * 2},${a * 2}
        `).fill('none').stroke({ width: border !== undefined ? border : 1 });
                break;
        }
        if (p) {
            g.add(p);
            p.clipWith(c);
        }
    } else if (pattern == 'diag') {
        var p, c;
        switch (shape) {
            case 'circle':
                var [d] = size;
                var r = d / 2;
                c = draw.clip().add(draw.circle(2 * r));
                p = draw.path(`
          M ${r * 2 / 4},0 L ${r * 2 / 4},0 ${r * 2 / 4},${2 * r}
          M ${r * 2 / 4 * 2},0 L ${r * 2 / 4 * 2},0 ${r * 2 / 4 * 2},${2 * r}
          M ${r * 2 / 4 * 3},0 L ${r * 2 / 4 * 3},0 ${r * 2 / 4 * 3},${2 * r}
        `).fill('none').stroke({ width: border !== undefined ? border : 1 });
                p.rotate(-45, r, r);
                break;
            case 'flower':
                var [d, b] = size;
                var r = d / 2;
                c = draw.clip().add(draw.path(flower(r, b)).rotate(45));
                p = draw.path(`
          M ${r * 2 / 4},0 L ${r * 2 / 4},0 ${r * 2 / 4},${2 * r}
          M ${r * 2 / 4 * 2},0 L ${r * 2 / 4 * 2},0 ${r * 2 / 4 * 2},${2 * r}
          M ${r * 2 / 4 * 3},0 L ${r * 2 / 4 * 3},0 ${r * 2 / 4 * 3},${2 * r}
        `).fill('none').stroke({ width: border !== undefined ? border : 1 });
                p.rotate(-45, r, r);
                break;
            case 'square':
                var [a] = size;
                var d = a / Math.sin(Math.PI / 4);
                c = draw.clip().add(draw.rect(a, a).translate(d / 2 - a / 2, d / 2 - a / 2).rotate(45));
                p = draw.path(`
          M ${d / 4},${-d} L ${d / 4},${-d} ${d / 4},${d * 2}
          M ${d / 4 * 2},${-d} L ${d / 4 * 2},${-d} ${d / 4 * 2},${d * 2}
          M ${d / 4 * 3},${-d} L ${d / 4 * 3},${-d} ${d / 4 * 3},${d * 2}
        `).fill('none').stroke({ width: border !== undefined ? border : 1 });

                p.translate(-d / 2 + a / 2, -d / 2 + a / 2)
                p.rotate(-45, d / 2, d / 2);
                break;
        }
        if (p) {
            g.add(p);
            p.clipWith(c);
        }
    }

    var dx = size[0];
    var dy = (size[1] === undefined ? size[0] : size[1]);
    if (shape == 'sidepill') {
        dx = size[0] / 2;
        dy = size[0];
    } else if (['circle', 'flower'].includes(shape)) {
        dy = size[0];
    }


    var bb = [offset[0], offset[1], offset[0] + dx, offset[1] + dy];

    if (['circle', 'flower'].includes(shape) && 'sidepill') {
        bb[0] -= size[0] / 4;
        bb[2] += size[0] / 4;
    }

    return { shape: g, bb };
}

function drawText(draw, options, offset) {
    var { content, color, special, font, style } = options;
    content === undefined ? '' : content;

    var cmap = {
        '0': colors['black'],
        'G': colors['green'],
        'P': colors['purple'],
        'Y': colors['yellow'],
        'R': colors['red'],
        '1': colors['black'],
    }

    var tl = content.split('');
    var cl = color.split('');
    var sl = (special ? special : '').split('');

    var t = draw.text(function (add) {
        tl.forEach((c, i) => {
            var ts = add.tspan(sl[i] == '.' ? udot(tl[i]) : tl[i]).fill(cmap[cl[i]]);
            if (cl[i] == '0') {
                ts.attr('class', 'black');
            }
            if (cl[i] == '1') {
                ts.font({
                    ...font,
                    'font-weight': 'bold'
                })
            }
            if (sl[i] == '_') {
                ts.attr('text-decoration', 'underline');
            }
            if (style) {
                ts.style(style);
            }
        });
    });

    t.font(font);
    t.translate(offset[0], offset[1]);

    return t.node;
}

function drawLine(draw, x, y, options) {
    var { width } = options;
    draw.line(x[2], (x[1] + x[3]) / 2, y[0], (y[1] + y[3]) / 2).stroke({ width });
}

function locateWords(spelling, draw, element) {
    var pb = draw.node.getBoundingClientRect();
    var tl = [...element.querySelectorAll('tspan')];
    tl = tl.map(t => {
        var b = t.getBoundingClientRect()
        b.x -= pb.left;
        b.y -= pb.left;
        b.left -= pb.left;
        b.right -= pb.left;
        return b;
    });

    var rl = [];
    var c = 0;
    for (var a of spelling.matchAll(/[,]* /g)) {
        var i = a.index;
        rl.push((tl[c].left + tl[i - 1].right) / 2);
        c = i + a[0].length;
    }

    if (c < spelling.length) {
        rl.push((tl[c].left + tl[spelling.length - 1].right) / 2);
    }

    return rl;
}

function boundWords(draw, element) {
    var pb = draw.node.getBoundingClientRect();
    var tl = [...element.querySelectorAll('tspan')];
    var left = tl[0].x - pb.left;
    var right = tl[tl.length - 1].y - pb.left;

    return [left, right];
}

// p: size pixels
// h: svg height in vh
function pixel2vp(p, h) {
    var ch = document.documentElement.clientHeight;
    return p / (h / 100 * ch) * 100 * 0.957;
}


function simpleCard(data, div) {
    div.innerHTML = `
        <div class="cover">
            <div id='ipa' style="display: flex; justify-content: center; align-items: center; height: 10vh;">
                <p style='color: gray; font-size: 6vh; text-anchor: center'></p>
            </div>
            <svg></svg>
            <div id='image' style="display: flex; justify-content: center;">
                <img style='width: auto; height: 30vh'></img>
            </div>
            <div id='hint' style="display: flex; justify-content: right;">
                <p style='color: gray; font-size: 3vh;'></p>
            </div>
        </div>
        `;
    var { spelling, pronounciation, meaning, type } = data;
    var ipa = pronounciation.split(', ')[1] ? pronounciation.split(', ')[1] : '';

    // Part 1: IPA
    var ipa = div.querySelector('#ipa p');
    ipa.innerHTML = pronounciation.split(', ')[1] ? pronounciation.split(', ')[1] : '';

    // Part 2: SVG
    var svg = div.querySelector('svg');
    var h = 50;
    var w = h / 4 * 3;
    var draw = SVG(svg).viewbox(0, 0, 100, 70);
    draw.width = `${w}vh`; draw.height = `${h}vh`;

    var r = 0.5; // font width/height ratio;
    var fontCommon = {
        anchor: 'middle'
    }

    function noun() {
        var size = Math.min(95 / spelling.length * 2, maxFontSize);
        var font = {
            ...fontCommon,
            size
        }
        var rh = Math.max(font.size, maxFontSize);

        var art2color = {
            'der': 'green',
            'das': 'purple',
            'die': 'yellow',
        }
        var art2code = {
            'der': 'G',
            'das': 'P',
            'die': 'Y',
        }

        var [full, gen, pl] = spelling.split(', ');
        var art = full.substring(0, 3);
        var stem = full.substring(4);

        var color = `${art} ${stem}, ${gen}, `.split('').map(c => {
            if ([' ', ','].includes(c)) return '0';
            return art2code[art];
        }).join('');

        var c = pl.startsWith('nur') ? '0' : 'R';
        color += pl.split('').map(_ => c).join('')

        var special;
        var [stress, _] = pronounciation.split(', ');
        if (stress.includes('{')) {
            var ai = `${art} `.length + stress.indexOf('{');
            var bi = `${art} `.length + stress.indexOf('}') - 2;
            special = spelling.split('').map((_, i) => i >= ai && i <= bi ? '_' : ' ').join('');
        }
        else if (stress.includes('[')) {
            var ai = `${art} `.length + stress.indexOf('[');
            special = spelling.split('').map((_, i) => i == ai ? '.' : ' ').join('');
        }

        // first row
        var element = drawText(draw, {
            font,
            color,
            special,
            content: spelling,
        }, [50, rh]);

        var l = locateWords(spelling, draw, element).map(x => pixel2vp(x, h));

        // second row
        // 1. art
        var color = art2color[art];
        div.style = `border-color: ${colors[color]}`;
        const x = drawShape(draw, {
            shape: 'square',
            size: [6],
            color,
            fill: 'full',
            border: 0.2,
        }, [l[0] - 3, rh * 2 - 3]);
        // 2. stem
        const y = drawShape(draw, {
            shape: 'square',
            size: [10],
            color,
            fill: 'full',
            border: 0,
        }, [l[1] - 5, rh * 2 - 5]);
        // 3. gen
        drawShape(draw, {
            shape: 'olive',
            size: [10, 8],
            color,
            fill: 'full',
            border: 0,
        }, [l[2] - 5, rh * 2 - 4]);

        // 4. pl
        if (!pl.startsWith('nur') && stem.length <= 15) {
            drawShape(draw, {
                shape: 'square',
                size: [10],
                color: 'red',
                fill: 'full',
                border: 0,
            }, [l[3] - 5, rh * 2 - 5]);
        }

        drawLine(draw, x.bb, y.bb, { width: 0.2 });
    }

    function verb() {
        div.style = `border-color: ${colors['gray']}`;

        var sl = spelling.split(', ');

        var inf = sl[0];
        sl = sl.slice(1);
        var pr3;
        if (sl.length == 3) {
            pr3 = sl[0];
            sl = sl.slice(1);
        }
        var [past, prät] = sl;

        var size = Math.min(95 / inf.length * 2, maxFontSize);
        var font = {
            ...fontCommon,
            size
        }
        var rh = Math.max(font.size, maxFontSize);
        drawText(draw, {
            font,
            color: spelling.split('').map(_ => '0').join(''),
            content: inf,
        }, [50, rh]);


        var size = Math.min(95 / (spelling.length - inf.length) / r, maxFontSize);
        var font = {
            ...fontCommon,
            size
        }
        var rh = Math.max(font.size, maxFontSize);
        var s = `${pr3 ? pr3 + ', ' : ''}${past}, ${prät}`;
        var element = drawText(draw, {
            font,
            color: spelling.split('').map(_ => '0').join(''),
            content: s,
        }, [50, rh * 2]);

        var l = locateWords(s, draw, element).map(x => pixel2vp(x, h));
        if (pr3) {
            drawShape(draw, {
                shape: 'circle',
                size: [8],
                color: 'gray',
                fill: 'full',
                border: '0',
            }, [l[0] - 4, rh * 3 - 3]);
        }

        drawShape(draw, {
            shape: 'clock',
            size: [8],
            fill: 'thin',
            color: 'gray',
            border: 0,
            clock: {
                type: 'simple',
                shape: 'circle',
                rotate: -45,
            }
        }, [l[pr3 ? 1 : 0] - 4, rh * 3 - 3]);

        drawShape(draw, {
            shape: 'clock',
            size: [8, 0.7],
            color: 'gray',
            fill: 'thin',
            border: 0,
            clock: {
                type: 'simple',
                shape: 'flower',
                rotate: 0
            }
        }, [l[pr3 ? 2 : 1] - 4, rh * 3 - 3]);

        drawShape(draw, {
            shape: 'circle',
            size: [8],
            color: 'gray',
            fill: 'full',
            border: 0.2,
            pattern: 'diag',
        }, [l[pr3 ? 3 : 2] - 4, rh * 3 - 3]);
    }

    function adj() {
        var [pos, comp, sup] = spelling.split(', ');

        var size = Math.min(95 / pos.length * 2, maxFontSize);
        var font = {
            ...fontCommon,
            size
        }
        var rh = Math.max(font.size, maxFontSize);

        var element = drawText(draw, {
            font,
            color: pos.split('').map(_ => '0').join(''),
            content: pos,
        }, [50, rh]);

        if (!comp || !sup) {
            var l = locateWords(pos, draw, element).map(x => pixel2vp(x, h));
            drawShape(draw, {
                shape: 'square',
                size: [8],
                fill: 'none',
                border: 0.6,
            }, [l[0] - 4, rh * 2 - 3]);
            return;
        }
        var s = `${comp}, ${sup}`;
        var size = Math.min(95 / s.length * 2, maxFontSize);
        var font = {
            ...fontCommon,
            size
        }
        var element = drawText(draw, {
            font,
            color: s.split('').map(_ => '0').join(''),
            content: s,
        }, [50, rh * 2]);

        var l = locateWords(s, draw, element).map(x => pixel2vp(x, h));
        drawShape(draw, {
            shape: 'square',
            size: [8],
            fill: 'none',
            border: 1,
        }, [l[0] - 4, rh * 3 - 3]);

        drawShape(draw, {
            shape: 'pill',
            size: [10, 2.5],
            fill: 'none',
            border: 0.3,
            pill: {
                shape: 'olive',
                fill: 'full',
                color: 'purple',
                border: 0.3,
                type: 'out',
            }
        }, [l[1] - 5, rh * 3 - 3 + 1.25]);

        drawShape(draw, {
            shape: 'square',
            size: [8],
            fill: 'none',
            border: 1.5,
        }, [l[2] - 4, rh * 3 - 3]);
    }

    function inflexible() {
        var size = Math.min(95 / spelling.length * 2, maxFontSize);
        var font = {
            ...fontCommon,
            size
        }
        var rh = Math.max(font.size, maxFontSize);
        var element = drawText(draw, {
            font,
            color: spelling.split('').map(_ => '0').join(''),
            content: spelling,
        }, [50, rh]);
        var l = locateWords(spelling, draw, element).map(x => pixel2vp(x, h));

        switch (meaning.part) {
            case 'art':
                drawShape(draw, {
                    shape: 'square',
                    size: [6],
                    fill: 'none',
                    border: 0.2,
                }, [l[0] - 3, rh * 2 - 3]);
                break;
            case 'pron':
                drawShape(draw, {
                    shape: 'square',
                    size: [8],
                    fill: 'small',
                    border: 0.3,
                }, [l[0] - 4, rh * 2 - 3]);
                break;
            case 'adv':
                drawShape(draw, {
                    shape: 'circle',
                    size: [8],
                    fill: 'none',
                    border: 0.2,
                }, [l[0] - 4, rh * 2 - 3]);
                break;
            case 'conj':
                var hook = 'middle';
                if (type == 'adv') {
                    hook = 'circle';
                } else if (type == 'sub') {
                    hook = 'right';
                }
                drawShape(draw, {
                    shape: 'hook',
                    size: [10],
                    fill: 'none',
                    border: 0.9,
                    hook: {
                        type: hook,
                    }
                }, [l[0] - 5, rh * 2 - 3]);
                break;
            case 'prep':
                var pill = 'neutral';
                if (type == 'nom') {
                    pill = 'square';
                } else if (type == 'gen') {
                    pill = 'olive';
                } else if (type == 'dat') {
                    pill = 'triangle';
                } else if (type == 'akk') {
                    pill = 'diamond';
                }
                drawShape(draw, {
                    shape: 'pill',
                    size: [12, 3],
                    fill: 'none',
                    border: 0.5,
                    pill: {
                        shape: pill,
                        border: 0.5,
                        fill: 'none',
                    }
                }, [l[0] - 6, rh * 2 - 3]);
                break;
        }
    }

    switch (meaning.part) {
        case 'n':
            noun();
            break;
        case 'v':
            verb();
            break;
        case 'adj':
            adj();
            break;
        default:
            inflexible();
            break;
    }

    // Part 3: Image
    var image = div.querySelector('#image img');
    image.src = meaning.image;

    // Part 4: Hint
    var hint = div.querySelector('#hint p');
    hint.innerHTML = meaning.hint;
}

function groupCard(data, div) {
    div.innerHTML = `
        <div class="cover">
            <div id='title' style="display: flex; justify-content: center; align-items: center; height: 10vh;">
                <p style='color: gray; font-size: 6vh; text-anchor: center'></p>
            </div>
            <svg></svg>
            <div id='hint' style="display: flex; justify-content: right;">
                <p style='color: gray; font-size: 3vh;'></p>
            </div>
        </div>
        `;

    var { spelling, meaning, pronounciation } = data;
    var sl = spelling.split('; ');

    // Part 1: Title
    var p = div.querySelector('#title p');
    p.innerHTML = pronounciation;

    // Part 2: SVG

    var svg = div.querySelector('svg');
    var h = 90;
    var w = h / 4 * 3;
    var draw = SVG(svg).viewbox(0, 0, 100, 100);
    draw.width = `${w}vh`; draw.height = `${h}vh`;

    var fontCommon = {
        anchor: 'left'
    }

    var size = h / sl.length;
    var rh = size;

    size = Math.min(size, maxFontSize);
    var font = {
        ...fontCommon,
        size
    }

    sl.forEach((s, i) => {
        drawText(draw, {
            font,
            color: s.split('').map(_ => '0').join(''),
            content: s,
        }, [0, rh * (i + 1)]);
    });

    switch (meaning.part) {
    }
}