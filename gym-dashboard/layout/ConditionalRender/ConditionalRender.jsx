import React from "react"

const ConditionalRender = ({ children }) => {
  return (
    <div className="min-h-screen px-4 sm:px-8">
      <div>{children}</div>
    </div>
  )
}

export default ConditionalRender
