const ConfirmDialog = ({ message, onConfirm, onCancel, confirmLabel = 'Delete' }) => (
  <div className="confirm-overlay">
    <div className="confirm-dialog">
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="action-btn action-btn--delete" style={{ padding: '10px 20px' }} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
