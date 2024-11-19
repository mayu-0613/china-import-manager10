const AlertMessage = ({ message, isProcessing }) => {
  if (!message) return null;

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: isProcessing ? 'orange' : 'lightgreen',
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
        borderRadius: '5px',
        marginBottom: '15px',
      }}
    >
      {message}
    </div>
  );
};

export default AlertMessage;
