# Keynote Image Safe Areas

Measured from Kaylen's thorough template:

| Region | Slide coordinates | Safe size | Aspect ratio |
| --- | --- | --- | --- |
| Hero/product image | `x=362, y=112` | `217 x 76` | `2.855:1` |
| Dimension drawing | `x=67, y=675` | `182 x 130` | `1.400:1` |
| Logo | `x=1, y=-13` | `176 x 72` | `2.444:1` |

The generator uses contain fitting inside the hero and dimension rectangles. It
preserves source aspect ratio, centers the result in the rectangle, and never
stretches or crops the source image.