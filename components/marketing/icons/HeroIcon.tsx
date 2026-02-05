import * as React from "react"
import { SVGProps, useId } from "react"

export function HeroIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId()
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={90}
      height={90}
      fill="none"
      {...props}
    >
      <path
        fill={`url(#${id})`}
        d="M45 0c.678 24.566 20.434 44.322 45 45-24.566.678-44.322 20.434-45 45-.678-24.566-20.434-44.322-45-45 24.566-.678 44.322-20.434 45-45Z"
      />
      <defs>
        <linearGradient
          id={id}
          x1={45}
          x2={-20.5}
          y1={0}
          y2={115}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3478f2" />
          <stop offset={1} stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
    </svg>
  )
}