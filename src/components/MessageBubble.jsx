// Recreates iMessage bubble styling, based on https://codepen.io/swards/pen/gxQmbj
// Primary limitation is that the bubble needs the background color from its parent element
// due to the way the tail cutout is created.

export default function MessageBubble({ message, isYours, bgColor }) {
  return (
    <div
      className={`relative inline-block p-2.5 rounded-2xl max-w-52 ${
        isYours
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-black'
      }`}
    >
      <p className="z-10 relative break-words">{message}</p>
      {/* Tail part 1 - creates the colored portion */}
      <div
        className={`absolute bottom-0 h-5 w-5 ${
          isYours
            ? 'right-[-8px] rounded-bl-[15px] bg-blue-600'
            : 'left-[-7px] rounded-br-[15px] bg-gray-200'
        }`}
      />
      {/* Tail part 2 - creates the cutout */}
      <div
        className={`${bgColor} absolute bottom-0 h-5 w-2.5 ${
          isYours
            ? 'right-[-10px] rounded-bl-[10px]'
            : 'left-[-10px] rounded-br-[10px]'
        }`}
      />
    </div>
  );
}