// Builds the artwork in chrome/: the title bars, the close box, the
// window-control glyphs and the desk pattern.
//
// Each piece is a small pixel grid, written as an SVG of merged rects.
// theme.json tiles the title bars and the desk and stretches the close
// box over its button, so every edge is whole pixels at 1x.
//
// Usage: node src/build-chrome.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..' );

function toSvg( px ) {
	const h = px.length;
	const w = px[ 0 ].length;
	const rects = [];
	for ( let y = 0; y < h; y++ ) {
		let x = 0;
		while ( x < w ) {
			const c = px[ y ][ x ];
			let end = x + 1;
			while ( end < w && px[ y ][ end ] === c ) {
				end++;
			}
			if ( c ) {
				rects.push( { x, y, w: end - x, h: 1, c } );
			}
			x = end;
		}
	}
	// Merge vertically identical runs.
	const merged = [];
	for ( const r of rects ) {
		const above = merged.find( ( m ) => m.x === r.x && m.w === r.w && m.c === r.c && m.y + m.h === r.y );
		if ( above ) {
			above.h++;
		} else {
			merged.push( { ...r } );
		}
	}
	const body = merged
		.map( ( r ) => `<rect x="${ r.x }" y="${ r.y }" width="${ r.w }" height="${ r.h }" fill="${ r.c }"/>` )
		.join( '' );
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${ w }" height="${ h }" viewBox="0 0 ${ w } ${ h }" shape-rendering="crispEdges">${ body }</svg>\n`;
}


function write( name, px ) {
	const file = join( ROOT, 'chrome', `${ name }.svg` );
	mkdirSync( dirname( file ), { recursive: true } );
	writeFileSync( file, toSvg( px ) );
	console.log( 'wrote', file );
}

/**
 * A glyph from ASCII art: `#` is ink, anything else is transparent.
 * Control glyphs are painted as masks, so only the shape matters.
 */
function glyph( rows, ink = '#000000' ) {
	return rows.map( ( row ) => [ ...row ].map( ( ch ) => ( ch === '#' ? ink : null ) ) );
}

const B = '#000000';
const Wh = '#ffffff';

/** A column of rows, each one colour, tiled horizontally. */
function strip( width, colours ) {
	return colours.map( ( c ) => Array( width ).fill( c ) );
}

// Title bars are 19px: 18 of bar and the black rule under it. The
// focused one carries six 1px stripes; the unfocused one is blank.
const STRIPED = [ Wh, Wh, Wh, B, Wh, B, Wh, B, Wh, B, Wh, B, Wh, B, Wh, Wh, Wh, Wh, B ];
write( 'titlebar-focused', strip( 2, STRIPED ) );
write( 'titlebar', strip( 2, [ ...Array( 18 ).fill( Wh ), B ] ) );

// The close box: an 11px square on a 1px white plate, and the same box
// with the burst it showed while held down. The inside is transparent:
// the button's background colour fills it (white at rest, the hover
// fill under the pointer), so the burst is drawn white to read on a
// dark hover.
const onPlate = ( row, y ) =>
	row.map( ( c, x ) => ( y === 0 || y === 12 || x === 0 || x === 12 ? Wh : c ) );
write( 'closebox', glyph( [
	'.............',
	'.###########.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.#.........#.',
	'.###########.',
	'.............',
], B ).map( onPlate ) );
write( 'closebox-pressed', [
	...glyph( [
	'.............',
	'.###########.',
	'.#....#....#.',
	'.#.#..#..#.#.',
	'.#..#...#..#.',
	'.#.........#.',
	'.###.....###.',
	'.#.........#.',
	'.#..#...#..#.',
	'.#.#..#..#.#.',
	'.#....#....#.',
	'.###########.',
	'.............',
	], B ),
].map( ( row, y ) =>
	row.map( ( c, x ) =>
		// Outline black, burst white.
		c && ( y === 1 || y === 11 || x === 1 || x === 11 ) ? B : c ? Wh : null,
	),
).map( onPlate ) );
// The close box carries no glyph of its own; the box is the face.
write( 'glyph-none', glyph( [ '.' ] ) );

// The desk: a 50% dither, black and white pixels alternating.
write( 'desk-gray', [ [ B, Wh ], [ Wh, B ] ] );
// The window-actions box: three short rules, drawn inside the same
// 13px box as the close box.
write( 'glyph-menu', glyph( [
	'.............',
	'.............',
	'.............',
	'.............',
	'....#####....',
	'.............',
	'....#####....',
	'.............',
	'....#####....',
	'.............',
	'.............',
	'.............',
	'.............',
] ) );
