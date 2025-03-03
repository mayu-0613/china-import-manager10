const AlertMessage = ({ message, isProcessing, isWarning }) => {
  if (!message) return null;

  let alertClass = "alert-message";
  if (isProcessing) {
    alertClass += " processing"; // ✅ 処理中（オレンジ）
  } else if (isWarning) {
    alertClass += " warning"; // ✅ 操作が必要（赤）
  } else {
    alertClass += " success"; // ✅ 成功（ライトグリーン）
  }

  return <div className={alertClass}>{message}</div>;
};

export default AlertMessage;
