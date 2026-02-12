import './Whiteboard.css'

function Whiteboard() {
    return (
        <div className="whiteboard">
            <iframe
                className="wb-excalidraw"
                src="https://excalidraw.com/"
                title="Whiteboard - Excalidraw"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    )
}

export default Whiteboard
