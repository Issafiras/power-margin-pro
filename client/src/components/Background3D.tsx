import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

function Stars(props: any) {
    const ref = useRef<any>()
    const [sphere] = useState(() => {
        const coords = new Float32Array(5000 * 3)
        for (let i = 0; i < 5000; i++) {
            // Uniform distribution on sphere surface + volume
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 1.5 * Math.cbrt(Math.random());

            coords[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            coords[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            coords[i * 3 + 2] = r * Math.cos(phi);
        }
        return coords
    })

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10
            ref.current.rotation.y -= delta / 15
        }
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#ff6600"
                    size={0.003}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.8}
                />
            </Points>
        </group>
    )
}

export default function Background3D() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-transparent">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
            </Canvas>
        </div>
    )
}
