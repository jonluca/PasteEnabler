import "./styles.css"

import { useStorage } from "@plasmohq/storage/hook"

function IndexPopup() {
  const [isDisabled, setIsDisabled] = useStorage("disabled", false)

  const toggleSwitch = () => {
    setIsDisabled(!isDisabled)
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 min-w-[250px] bg-white shadow-lg rounded-lg space-y-6">
      <div className="flex items-center space-x-3">
        <div
          className={`w-3 h-3 rounded-full ${!isDisabled ? "bg-green-500" : "bg-gray-300"}`}
        />
        <h2 className="text-lg font-medium text-gray-800 whitespace-pre">
          {!isDisabled ? "Extension Enabled" : "Extension Disabled"}
        </h2>
      </div>

      <button
        className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 
          ${
            !isDisabled
              ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
              : "bg-green-500 hover:bg-green-600 active:bg-green-700"
          } text-white`}
        onClick={toggleSwitch}>
        {!isDisabled ? "Disable" : "Enable"}
      </button>
    </div>
  )
}

export default IndexPopup
