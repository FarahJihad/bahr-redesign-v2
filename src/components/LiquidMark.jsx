import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Surface equation and material adapted from Bahr's original hero renderer.
class WaveField {
  constructor(size = 128) {
    this.size = size;
    this.height = new Float32Array(size * size);
    this.velocity = new Float32Array(size * size);
    this.next = new Float32Array(size * size);
    this.pixels = new Uint8Array(size * size * 4);
  }

  disturb(u, v, strength = 0.08, radius = 0.045) {
    const n = this.size;
    const cx = u * (n - 1), cy = v * (n - 1), r = radius * n;
    for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.min(n - 2, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(1, Math.floor(cx - r)); x <= Math.min(n - 2, Math.ceil(cx + r)); x++) {
        const distance = Math.hypot(x - cx, y - cy) / r;
        if (distance < 1) {
          const index = y * n + x;
          this.height[index] = Math.max(-0.8, Math.min(0.8,
            this.height[index] + strength * (Math.cos(distance * Math.PI) + 1) * 0.5));
        }
      }
    }
  }

  stroke(fromU, fromV, toU, toV, strength, radius) {
    const distance = Math.hypot(toU - fromU, toV - fromV);
    const steps = Math.max(1, Math.min(64, Math.ceil(distance / (radius * 0.35))));
    const dose = strength / Math.sqrt(steps);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      this.disturb(fromU + (toU - fromU) * t, fromV + (toV - fromV) * t, dose, radius);
    }
  }

  step() {
    const n = this.size, h = this.height, v = this.velocity, next = this.next;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        const laplacian = h[i - 1] + h[i + 1] + h[i - n] + h[i + n] - 4 * h[i];
        v[i] = (v[i] + laplacian * 0.23) * 0.983;
        next[i] = (h[i] + v[i]) * 0.997;
      }
    }
    this.height = next;
    this.next = h;
  }

  encode(alpha = 1) {
    // Store height in two bytes to avoid banding in the normal reconstruction.
    // Interpolate the previous and current fixed steps for smooth display at 60–144 Hz.
    const blend = Math.max(0, Math.min(1, alpha));
    for (let i = 0; i < this.height.length; i++) {
      const height = this.next[i] + (this.height[i] - this.next[i]) * blend;
      const value = Math.round((Math.max(-1, Math.min(1, height)) * 0.5 + 0.5) * 65535);
      this.pixels[i * 4] = value >> 8;
      this.pixels[i * 4 + 1] = value & 255;
      this.pixels[i * 4 + 2] = 0;
      this.pixels[i * 4 + 3] = 255;
    }
    return this.pixels;
  }
}

export default function LiquidMark() {
 const host=useRef(null);
 useEffect(()=>{
 const el=host.current; let renderer;
 try {renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});}catch{return;}
 el.querySelector('.agency-liquid-surface').appendChild(renderer.domElement);
 const lost=e=>{e.preventDefault();renderer.domElement.style.opacity='0';};
 const restored=()=>{renderer.domElement.style.opacity='1';resize();resume();};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 renderer.domElement.addEventListener('webglcontextrestored',restored);
 const field=new WaveField(128);
 const texture=new THREE.DataTexture(field.encode(),128,128,THREE.RGBAFormat); texture.minFilter=texture.magFilter=THREE.LinearFilter;
 const palette=new THREE.TextureLoader().load('data:image/webp;base64,UklGRmYNAABXRUJQVlA4IFoNAAAwgQCdASoAAgACPp1OoU02Ky6pIliIcLATiWdu/GuW9ufpzBRf2oeduPukOUMd5l6x0uu1eoB6pE1E0cZD524TuKk1JO8dZ7ao0DY/K8tkmiZh1HcxWMEfMCNX86vHfqEEVnspWyTUlftPuhWT+aOMeI85K+ahI01fSTsBmTrqouKiXkIyJU4GnZOcmukd2T/zRxjxGX1ALocSmf/+rfzypVYbn1H470ovF3RlzdapM8r8Ro4r6S4ODBoDCVh29zYtq+fcjmIdjYIr5CitxypTUY8VTt8gNH+6Dovl73FqRg0FeWoWsyPcEf6uAHh+5o5rhEqmCZfg2eSjLzAx5LrOoLENPR/+JS211qawQun+YQsCarhnp1vCkNxL8ISjETirajtdKdqcPBKeh30KbuvH5U9+/ENT52QlbcJTx/0eXCY6nOpMRr3xOh7IqNRp6fVEJnNrQXHyvt+A8OdBesou9coG2pGkxKNiXsIZk3DAQH06JsQ9JuqNmd0+Uqd8iqXPNB4k0UF5Yl8vFiCVcKU5C/h4pIVSV676k9eSMrgbKWEYn/e/uYEbi1lCLWuk6YnWra4dk2HaLjNXhmCSpOo8JkdH1jSri+6P+otxiLkXjSuMAPB4Z6zOG5qWAMsCy1brfS24VQEw+4NFaHyc6hi9cbaSH+1vTUvyxBc/mWDUvZr9pU2C5rz63qij5Wh8P+57KNn1GkXdYmGaoXpGxOPcEXyKXyKGILDDP8MJVfYoMYKIm4TpyKa/s+ZKmgktjAu/jpgvZkjn/xaEtxWYVle6VnxyFpUHIECpwWIv46zYs5oCVDHNl8yzmXvSv/hRR0f2NordbOkepWnakpjUaOKZJ1LnoQg6q8mRpD4WA4YSPk9QtzoGhcIK6kpFnYM9EOdQ9mQTjP5XN7o4IQBPOsYoeRjquFPcgVAELTmqg3wdb6BoEwueZCs0g0zuJBXU3h1G91oBBA4GEopN1/WolqMeAdXHSh29pGmEC+rDswuSERsiHxWMe63HjWpY0s2if+X4LXrtUXAjRuksNOiDYacRVnJoUNnHiFjiglig5K34GrTM3tjVkGXX1oDJJMdJCrDxyP1N4STenjk3j6zM0XBbw/naDRx/DqChDNL+emvKl56GUFtH3Yu4Bn0BCPut9wEwZ6bSLfvHgHbjPVfYRROEaAOz0mt2ftcJ+KS8AAv6MVVoAzQUZEpol9YPxj7s433LjA2JvYIX/bp8USjO1wcL/htzAZM88PIbOJk7sE3xpvj3/vZqSUKSWjNHGPEZlFz82spAKt257aQTs5l/3ap5l99M4v/+Nun//HdLrU3aH5RjxGjkwKLv7DRei2Cu0JffXI2iY5MbGV4DkoArVnO4z9AoSr/37aB+d6Gs9gzLnE0AAP75WEAA8Q2T3jfjCySbJue0qhV1BCOoPE8sMoSgM2yswohqSi/IUE6Tn/6xQ4ZfTGOb448B7tQP9nKdCLKTw/xTTbDe7RSjYRrIvr5vkYz9yO53IX9qtMx8jERNpbeJ9ztWv4YtGNUMW8fE/3gI34yJeFw4EqgJBFQAAtF54gK1ituweRUlEa/gzwmhafcp8jQBsJXyqrehngdDBpHazKO4iXwKftDIOg76z8RWjMbR4HU9sq1Kudf5gZpDc3EDjhmJD9xre7IUAAAcf5FXSONDazghn1nLAhqTg2ea5t4i97btgoI+vvT3WzS4+pEoxKy41qA34n0RfVxovVPXHl0DjlKHsnApP8UU++Jbnbj6CJO4AAVFhqajona6j7SUId2HvgIRApWyQtiEQ0qxq748TmkvP1aFOFcYplygvURHSCKPddiYjb19V3DvlVdABAiC/PZKDGzPukYr5CZI2QS8kStCVIzg6jAhsUGzBZvENQbOv1jgYVNHnn4ypoQb742uXyqugLDyQ/4HVVfM6VCKYder8J8xntFvHMBFODB0FTR8zJkOTOBVLcAEYC4WO1pCISy1fnR376TJBWYPVUuBegSHtUv3hdG7bWKIt6CCrRhSazMyVTBfScZgCCr7g3Or4BTFqyTHgmiyxs6ne0pik/n/ho8E31j7JN0ZNp6QNcefsQ3z0OjWPAj1Qgiu6ITJ1NzbjjzlsaNKcEshkgDns3/t5sBjMqaYkjjm16tV2spM11x1iKNVmY3g9IQqP22IOlEZ/9QL/cjdGQE04OtDDLBidK/9AoTolgRqg6HrVk3xdhUPJOACUAFyvGDQTeWgIbfcVU9dO/2Ua1buGLZTBHyQvoaYA4BHlVfq0A/55a08hpy1dzH0lPQ675vq15cmN1q8GjzV6UgROGZ4mc18H/kXyUcJf3XoN739MVKwKj7U95Wq3ivhMkXIeBdHw2lZTNZviL4ChQcaql0OjamHy1EhSO9XmmJOh3F4f1USpWJCd7lend+YaAnLStofen6aJsNkkjVdNVyCLLrachi9pVpoM9WX0f3WWFkyok7/2xeYxEOI9nHgTq5Te/iSXK7QyvOD/ZSgWjullxtBrzbpDewT36t0045xroUX/YgNW5GNAEnOW7hAcQqj+gDAab0+q9zEML325ikpGoVayse/3YpzI5YZC0wrPvQSEM5JKy2+uh0ZOmqth5JoIuI148LhvXRVDCWvqZ4SR4lwl+/WDlaFKD7kRTddVjPyME2vS7a0qHp6gtwAV0F56FCpFPuGuRWESntXvRiDOrvch2G/hSphUNHilWkPuZ0nVIxzbYqzqtHGUnLhDtxVJyIYmHyK4yUwNxEzWlMXtJDhWnnUkcsr2XNYs2mBXpUzCDK8zwtJg6gnh70aZvqju3uH1HJx5S4K6skx74jNu1y513yHxFGomUg33mQHueEa+jfTBbhTpumrXveOzhd8GQtlgc8dj4/vVZTDUsMKqJWiXYMzwP0Sc4OM26+gslHVYbg9noz1ZcHvZzKNzT2LDQkrThhw16zkVry7L7EM+26ZQTBYV/7KhTFIFayaEbafkf+yjgvp5n2X26NfvaUkwrQdRG/VK1+rhnqFuLz4mXB055l9vVEuBNuzzSEzvOg4g99VE2WJeUiXDDYH9lSKyJGLIm1pdqnJXnd57w6LkCeicJP7b2sBlygXDXjjCUom5s/OJ/06a9viWPxHFYckR/Mymugq3HAgvelQ62jUBSDxLjdTz3G2srKy2uJ0pliQzvC4OuAKJBXIWYCmsN/tFa5lva5rIv1+RaKdneiitXQOeF5z+/arufd6DzIpcGtUzbT2GRxW9hza2L2fI0UJT4jtW8MHuUHmTXgZ1KyiSqPJnqKdCcEVYNqRv4LJBwaYkccEAPCKpBURwzuPo1N+4AwPEeTW7dvyk/qreo8gFrlslobaqqV/DDDxWXhLCicvf5oayI76vmvQOg6PIFLegKLuco9oqXoRfCH6AjjOHYwpoukYHQCqUL9v1YKM8ug0/XcKcRScGDtI0EamKd1RzgHO13S7lzrE0vgKlxZQOcfvaeuiWcgkXaNoyS5CDnqSAsVUk5HN3eDnhfQ4gjSFgvR8VLQW/zLsT+ymvfdkl5qoF7XY4rTPJtlQJAHaFK32blwUbCb0BW/0eEdqc8+rxOcg1OMBIVLz7+uNfofBhzrNlJtXZ6HQxO8oU2Blrnx2y2wpZq19ykcADbKilz8kapnGaaf6QvZZRf3zVS0xiL9PejdiWdzqtbUpNppDCHh8oEueRC/HOnAR7EvBHs13EIaWVwBCF2pnid0l8NEHs7+6+mJu/wc6PDTNt3Mgfaxk66OGUB+G32BEG2jyD0VUi7JkvJLKD+NmjXBFzX0pLHe8VWT1TFHk2A3JPu6y1/aAScogGVU65BOK8Fd8+Sw2X0xgSDimwviUO1MhXKdxz2+7/tNy7YvjvoLg362OA8z2CWo3SoQQEkwk7AatHNkeq711t7ILBt8F6cJkaeh3Gyu15JjIOyvDkfzk606TgSyr4HkHgcxnAifjNNd5Mizg2R+kw1qI9wnt9Wl75Omjz7IL8MttEbCqDNtK/osyuwSQItrmkj0O5sj7SxlhLAPuApjg7yew5G5d1xvNAGE2+5DEbJBMT5IJFaPTx27X4YXIwzYB2LwCgm87mQP93z4+QHyQ2Pfyu1YhRlo0T6qUX51MJTN0ojuwgGFi7w2jk4Oe8hQ2zMEM00ExwLuL2ptMM9aGqv1e4GBp1Zlne3dDAt/tURefCR4FxCZlr7bLyvdTuiK2vfWHaTqh9huL3XnOzobWAD9tZ+a+/dE9cO0olqDAEYHjsvxWDD6eljyB3NTq3i52Tuo76+3AUtAC1IDDjhhYEG/U/I59toLEuTVXexf4mkR7apWJ/nEUpgKA827J/YCaC5uBRhtXw4Z4rcf3EUtQrP7Wk8pbC+unLEcAb+jrnsqaSRqDRoqUMHuV4utI0IqhAVVW3gN6Y6xsukwpgMQgAzZ9eMZxBWYOUXVCYrJaMPR5pz6XUOCvMB4biiG8NsSTJp7CII4SGNICKVL7d5BhvqQeDC4hEj++OX9Zxx8fGkLkCaOCzRrKEub6MJbXxNQJM/1dC/Q6SZzX/nPaz2sGxcWIMn8qDcTRYsO0CoRlebOlgAAAAAAA');
 const uniforms={surface:{value:texture},palette:{value:palette},darkPalette:{value:palette},time:{value:0},themeMix:{value:1},texel:{value:1/128},cursor:{value:new THREE.Vector3(.5,.5,0)}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv; void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
precision highp float;
varying vec2 vUv;
uniform sampler2D surface;
uniform sampler2D palette;
uniform sampler2D darkPalette;
uniform float time;
uniform float themeMix;
uniform float texel;
uniform vec3 cursor;
float heightAt(vec2 point) {
  vec2 channels = texture2D(surface, clamp(point, 0., 1.)).rg;
  return (channels.r * 65280. + channels.g * 255.) / 65535. * 2. - 1.;
}
void main() {
  vec2 p = (vUv - .5) * 2.;
  vec2 slope = vec2(heightAt(vUv + vec2(texel, 0.)) - heightAt(vUv - vec2(texel, 0.)),
                    heightAt(vUv + vec2(0., texel)) - heightAt(vUv - vec2(0., texel)));
  // A broad, continuous depression reacts every display frame. The wave field
  // adds the trailing ripples; it no longer carries the whole hover response.
  vec2 delta = vUv - cursor.xy;
  float footprint = exp(-dot(delta, delta) / .0225) * cursor.z;
  vec2 bend = delta * footprint * 13.;
  float z = sqrt(max(.02, 1. - dot(p, p)));
  vec2 current = vec2(sin(p.y * 5. + time * .7), cos(p.x * 4. - time * .55)) * .038;
  vec3 normal = normalize(vec3(p * .20 - slope * 34. + bend + current, .85 + z * .15));
  float turn = .8 + sin(time * .34) * .9;
  mat2 rotation = mat2(cos(turn), -sin(turn), sin(turn), cos(turn));
  vec2 colorUv = rotation * (p * .45 + slope * 2. + bend * .19) + .5;
  // Light theme: navy / cobalt / azure from the palette's blue channel. Dark theme: the pastel orb texture as-is.
  float blueTone = texture2D(palette, colorUv).b;
  vec3 lightColor = mix(vec3(.16, .48, .68), vec3(.35, .75, .88), smoothstep(.05, .55, blueTone));
  lightColor = mix(lightColor, vec3(.78, .94, .98), smoothstep(.55, .95, blueTone));
  vec3 color = mix(texture2D(darkPalette, colorUv).rgb, lightColor, themeMix);
  vec3 light = normalize(vec3(cos(time * .55) * .9, sin(time * .55) * .65, 1.));
  float diffuse = max(0., dot(normal, light));
  vec3 shaded = mix(2. * color * diffuse, 1. - 2. * (1. - color) * (1. - diffuse), step(.5, color));
  float highlight = pow(max(0., dot(normal, normalize(light + vec3(0., 0., 1.)))), 38.);
  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255.;
  // The supplied vector silhouette masks this liquid material in CSS.
  gl_FragColor = vec4(mix(color, shaded, mix(.74, .38, themeMix)) + highlight * mix(.1, .035, themeMix) + grain, 1.);
}
`});
 const geo=new THREE.PlaneGeometry(2,2);const scene=new THREE.Scene();scene.add(new THREE.Mesh(geo,material));const camera=new THREE.Camera();
 const pointer={x:.5,y:.5,sx:.5,sy:.5,tx:.5,ty:.5,active:false,down:false}; let visible=false,frame=0,last=0,acc=0,elapsed=0,drop=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const resize=()=>{const r=el.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(r.width,r.height);renderer.render(scene,camera);};
 const move=e=>{if(e.pointerType!=='mouse'||reduced.matches)return;const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=1-(e.clientY-r.top)/r.height;if(!pointer.active){pointer.sx=pointer.tx=x;pointer.sy=pointer.ty=y;}pointer.x=x;pointer.y=y;pointer.active=true;};
 const leave=()=>{pointer.active=pointer.down=false;};const down=e=>{move(e);pointer.down=pointer.active;if(pointer.active)field.disturb(pointer.x,pointer.y,-.15,.06);};const up=()=>{pointer.down=false;};
 const tick=now=>{frame=0;if(!visible||document.hidden||reduced.matches)return;const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;const follow=1-Math.exp(-dt*38);pointer.sx+=(pointer.x-pointer.sx)*follow;pointer.sy+=(pointer.y-pointer.sy)*follow;uniforms.cursor.value.x=pointer.sx;uniforms.cursor.value.y=pointer.sy;uniforms.cursor.value.z+=((pointer.active?(pointer.down?1.65:1.15):0)-uniforms.cursor.value.z)*(1-Math.exp(-dt*20));
 if(elapsed-drop>.22){const a=elapsed*2.399;field.disturb(.5+Math.cos(a)*.28,.5+Math.sin(a*1.37)*.28,.015,.04);drop=elapsed;}
 acc+=dt;while(acc>=1/60){if(pointer.active){const d=Math.hypot(pointer.sx-pointer.tx,pointer.sy-pointer.ty);field.stroke(pointer.tx,pointer.ty,pointer.sx,pointer.sy,pointer.down?-.13:Math.min(.16,.016+d*3.5),pointer.down?.08:.055);}pointer.tx=pointer.sx;pointer.ty=pointer.sy;field.step();acc-=1/60;}
 texture.image.data=field.encode(acc*60);texture.needsUpdate=true;uniforms.time.value=elapsed;renderer.render(scene,camera);frame=requestAnimationFrame(tick);};
 const resume=()=>{cancelAnimationFrame(frame);last=performance.now();if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else renderer.render(scene,camera);};
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();});observer.observe(el);const sizes=new ResizeObserver(resize);sizes.observe(el);
 el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);el.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resize();
 return()=>{cancelAnimationFrame(frame);observer.disconnect();sizes.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);geo.dispose();material.dispose();texture.dispose();palette.dispose();renderer.domElement.removeEventListener("webglcontextlost",lost);renderer.domElement.removeEventListener("webglcontextrestored",restored);renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="agency-liquid-host" ref={host} aria-hidden="true"><img className="agency-liquid-fallback" src="/bahr-mark.svg" alt="" /><div className="agency-liquid-surface" /></div>;
}
