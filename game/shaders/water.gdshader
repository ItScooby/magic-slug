shader_type canvas_item;
// Water that mirrors what is drawn above its surface (floor, props, heroes).
// The rect's top edge is the surface. Tuning: tint, strength, waves.

uniform sampler2D screen_tex : hint_screen_texture, filter_nearest;
uniform vec4 tint : source_color = vec4(0.16, 0.42, 0.62, 1.0);
uniform vec4 deep : source_color = vec4(0.04, 0.10, 0.22, 1.0);
uniform vec4 foam : source_color = vec4(0.80, 0.95, 1.0, 1.0);
uniform float strength = 0.75;       // how much of the reflection shows
uniform float rect_height = 60.0;    // set by water.gd (pixels)
uniform float wave_px = 1.0;         // sideways wobble of the reflection
uniform float squash = 0.15;         // 0 = exact mirror, more = shorter reflection

void fragment() {
	float depth_px = floor(UV.y * rect_height);          // pixels below the surface
	float wob = floor(sin(TIME * 3.0 + depth_px * 0.7) * wave_px + 0.5);
	vec2 px = SCREEN_PIXEL_SIZE;
	vec2 uv = SCREEN_UV;
	uv.y -= (depth_px * (2.0 + squash) + 1.0) * px.y;   // mirror line = top edge
	uv.x += wob * px.x;
	vec3 refl = texture(screen_tex, uv).rgb;
	float fade = clamp(depth_px / 44.0, 0.0, 1.0);
	vec3 water = mix(tint.rgb, deep.rgb, fade);
	vec3 col = mix(water, mix(refl, refl * tint.rgb * 2.0, 0.5), strength * (1.0 - fade * 0.7));
	// sparkles and a foam line on the surface
	float shine = step(0.985, fract(sin(floor(FRAGCOORD.x / 3.0) * 12.9898 + floor(TIME * 4.0)) * 43758.5453));
	col = mix(col, foam.rgb, shine * step(depth_px, 6.0) * 0.6);
	if (depth_px < 1.0) col = foam.rgb;
	else if (depth_px < 2.0) col = mix(col, foam.rgb, 0.5);
	COLOR = vec4(col, 1.0);
}
