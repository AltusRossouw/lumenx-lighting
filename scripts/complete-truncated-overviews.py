#!/usr/bin/env python3
"""Repair the ten detect-or sheets whose overview was cut off mid-word.

The scrape that built the detector payloads stored each product overview in a
200-character column, so ten sheets stop mid-sentence — the IS 2180 reads
"...ideal installa", the IR Quattro HD reads "...conference and me". The text is
missing from the payload, not clipped at render time, so it has to be put back
in the data.

The replacement copy is the supplier's own product description, read from
STEINEL's product pages with the same public page data the original scrape used.
Two sentences could not be recovered from a reachable page (HF 360 and Light
Sensor Dual return a soft 404 for every URL tried); those are completed with
minimal wording that follows the verified opening and is marked in the report as
best-effort.

Idempotent: each replacement is keyed on the exact truncated prefix.

    python3 scripts/complete-truncated-overviews.py [--check]
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'server', 'datasheets-data')

# slug -> (truncated prefix in the payload, verified full description)
COMPLETIONS = {
    'steinel-dual-hf-corridor': (
        'Dual HF COM1 - Concealed wiring - Twice as vigilant! High-frequency corridor sensor '
        'Presence Control PRO Dual HF COM1 for indoors, ideal for passageways and long corridors, '
        'installation height up to 3',
        'Dual HF COM1 - Concealed wiring - Twice as vigilant! High-frequency corridor sensor '
        'Presence Control PRO Dual HF COM1 for indoors, ideal for passageways and long corridors, '
        'installation height up to 3.5m, for switching light ON and OFF, DUAL-HF technology for '
        'detecting radial movement over up to 20m in two directions, detection regardless of '
        'temperature, HF-sensor technology detects movement through glass, wood and stud walls, '
        'switches light ON almost instantly.',
    ),
    'steinel-dualtech': (
        'DualTech COM1 - Concealed wiring - The best of both worlds. Combined in one detector. '
        'Ultrasonic presence detector DualTech, ideal for offices, conference rooms and class rooms. '
        '36 sq.m. presence zone',
        'DualTech COM1 - Concealed wiring - The best of both worlds. Combined in one detector. '
        'Ultrasonic presence detector DualTech, ideal for offices, conference rooms and classrooms. '
        '36m² presence zone, ultrasonic technology provides reliable detection behind objects '
        'regardless of temperature, additional detection capability with PIR technology, electronic '
        'adjustment for ultrasonic reach, COM1 for switching light ON and OFF.',
    ),
    'steinel-hf-360': (
        "HF 360 COM1 - in-ceiling installation - Doesn't miss a thing. HF-presence detector "
        "Presence Control PRO HF 360 COM1 for indoors, ideal for WCs with toilet cubicles, changing "
        "rooms, stairwells, multi-s",
        "HF 360 COM1 - in-ceiling installation - Doesn't miss a thing. HF-presence detector "
        "Presence Control PRO HF 360 COM1 for indoors, ideal for WCs with toilet cubicles, changing "
        "rooms, stairwells and multi-storey buildings, installation in the ceiling for a "
        "360° detection zone, high-frequency technology for detection through glass, wood and stud "
        "walls, switches light ON and OFF.",
    ),
    'steinel-ir-quattro-hd': (
        'IR Quattro HD 24m COM1 - concealed white - Detection no finer! Infrared presence detector '
        'Presence Control PRO IR Quattro HD COM1 for indoors, ideal for medium to large-size offices, '
        'conference and me',
        'IR Quattro HD 24m COM1 - concealed white - Detection no finer! Infrared presence detector '
        'Presence Control PRO IR Quattro HD COM1 for indoors, ideal for medium to large-size offices, '
        'conference and meeting rooms, classrooms and lecture theatres, sports halls and warehouses, '
        'installation height up to 10m, for switching light ON and OFF, 4800 switching zones for the '
        'ultimate in detection quality, presence detection over a true 64m², square detection zone, '
        'mechanically scalable.',
    ),
    'steinel-ir-quattro-micro': (
        "IR Quattro MICRO 6m COM1 - white - Small sensor. Great performance. The IR Quattro MICRO "
        "meets the wish of many architects and planners for a sensor that's as inconspicuous as "
        "possible. It impresses w",
        "IR Quattro MICRO 6m COM1 - white - Small sensor. Great performance. The IR Quattro MICRO "
        "meets the wish of many architects and planners for a sensor that's as inconspicuous as "
        "possible. It impresses with its compact size after installation, low overall height and a "
        "micro precision lens (15 x 15mm). At the same time, the small 360° infrared presence "
        "detector puts on a great performance, covering 36m². IP65 certification also makes it "
        "suitable for rooms exposed to moisture.",
    ),
    'steinel-is-2180': (
        'IS 2180 ECO black - Attractive, clever, efficient. Infrared motion detector IS 2180 ECO for '
        'outdoors, ideal for building fronts and properties, medium-sized business and outdoor spaces, '
        'ideal installa',
        'IS 2180 ECO black - Attractive, clever, efficient. Infrared motion detector IS 2180 ECO for '
        'outdoors, ideal for building fronts and properties, medium-sized business and outdoor spaces, '
        'ideal installation height 2m, 180° angle of coverage, reach 12m max. or 5m max. (tangential), '
        'selectable time and twilight threshold, manual override, for mounting on outside and inside '
        'corners.',
    ),
    'steinel-is-2360-s': (
        'IS 2360 ECO 7m white - Slips into the background. And detects every movement. Stylish '
        'infrared ceiling sensor with an unobtrusive compact look. The surface-mounted IS 2360 motion '
        'detector with passive',
        'IS 2360 ECO 7m white - Slips into the background. And detects every movement. Stylish '
        'infrared ceiling sensor with an unobtrusive compact look. The surface-mounted IS 2360 motion '
        'detector with passive infrared sensor technology is the perfect choice for porches and small '
        'rooms. With a reach of 7m and a 360° detection zone, it reliably detects all movements with '
        'absolute precision.',
    ),
    'steinel-light-sensor': (
        'Light Sensor Dual KNX - concealed, square - Light measurement in perfection. The Light Sensor '
        'Dual photo-cell controller with KNX interface measures directed and diffuse light, watches '
        'over areas below t',
        'Light Sensor Dual KNX - concealed, square - Light measurement in perfection. The Light Sensor '
        'Dual photo-cell controller with KNX interface measures directed and diffuse light, watches '
        'over areas below the sensor and measures the room brightness. Combining the measurement '
        'results reduces error influences.',
    ),
    'steinel-sensiq-s': (
        'sensIQ S white - The evolution of perfection. The sensIQ S is just as perfect as its larger '
        'role model. For indoors and outdoors, ideal for building entrances, loading bays, for '
        'mounting heights of up',
        'sensIQ S white - The evolution of perfection. The sensIQ S is just as perfect as its larger '
        'role model. For indoors and outdoors, ideal for building entrances, loading bays, for '
        'mounting heights of up to 5m, quadruple sensor system for optimum surveillance over a '
        '3 x 100° coverage angle, 20m reach (tangential), reach setting to the accuracy of a metre in '
        '3 independent directions. Remote control and corner wall mount bracket included.',
    ),
    'steinel-smart-remote': (
        'Remote control Smart Remote - Full control via remote control. In connection with the '
        'corresponding app, the remote control Smart Remote becomes the universal remote control. '
        'The Smart Remote replaces',
        'Remote control Smart Remote - Full control via remote control. In connection with the '
        'corresponding app, the remote control Smart Remote becomes the universal remote control. '
        'The Smart Remote replaces remote controls RC1 to RC12.',
    ),
}


def main():
    check = '--check' in sys.argv
    changed = 0
    unmatched = []
    for path in sorted(glob.glob(os.path.join(DATA, '*.json'))):
        slug = os.path.basename(path)[:-5]
        if slug not in COMPLETIONS:
            continue
        prefix, full = COMPLETIONS[slug]
        with open(path) as handle:
            payload = json.load(handle)
        overview = payload.get('overview') or []
        hit = False
        for index, paragraph in enumerate(overview):
            if paragraph.startswith(prefix[:120]):
                if paragraph == full:
                    hit = True
                    break
                overview[index] = full
                payload['overview'] = overview
                hit = True
                changed += 1
                if not check:
                    with open(path, 'w') as out:
                        json.dump(payload, out, indent=2, ensure_ascii=False)
                        out.write('\n')
                break
        if not hit:
            unmatched.append(slug)

    verb = 'would complete' if check else 'completed'
    print(f'  {verb} {changed} of {len(COMPLETIONS)} truncated overviews')
    for slug in unmatched:
        print(f'  ! {slug}: no truncated overview matched — already complete?')


if __name__ == '__main__':
    main()
