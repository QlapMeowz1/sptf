document.addEventListener('DOMContentLoaded', function() {
  // Lấy IP thật từ API
  let userIp = localStorage.getItem('user-ip');
  if (!userIp) {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        userIp = data.ip;
        localStorage.setItem('user-ip', userIp);
      });
  }

  const SHEET_API = 'https://api.sheetbest.com/sheets/c620e490-99aa-4e8f-b32a-29cd6ed3fec3'; // Đã cập nhật endpoint

  // Gửi lời nhắn
  document.getElementById('send-msg-btn').onclick = function() {
    const msg = document.getElementById('msg-input').value.trim();
    const nickname = document.getElementById('nickname-input').value.trim() || 'Ẩn danh';
    if (!msg) return alert('Vui lòng nhập lời nhắn!');
    const time = new Date().toLocaleString();

    // Kiểm tra 24h mỗi IP chỉ gửi 1 lần
    fetch(SHEET_API)
      .then(res => res.json())
      .then(msgs => {
        // Lọc các lời nhắn của IP này
        const myMsgs = msgs.filter(m => m.ip === userIp);
        if (myMsgs.length > 0) {
          // Lấy lời nhắn gần nhất
          const lastMsg = myMsgs.reduce((a, b) => new Date(a.time) > new Date(b.time) ? a : b);
          const lastTime = new Date(lastMsg.time);
          const now = new Date();
          const diff = now - lastTime;
          if (diff < 24 * 60 * 60 * 1000) {
            const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - diff) / (60 * 60 * 1000));
            alert('Bạn chỉ được gửi 1 lời nhắn mỗi 24h! Vui lòng thử lại sau ' + hoursLeft + 'phút nữa.');
            return;
          }
        }
        // Nếu chưa gửi hoặc đã quá 24h, cho gửi
        fetch(SHEET_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip: userIp, nickname, msg, time })
        })
        .then(res => res.json())
        .then(() => {
          document.getElementById('msg-input').value = '';
          document.getElementById('nickname-input').value = '';
          alert('Đã gửi lời nhắn ẩn danh!');
        })
        .catch(() => alert('Gửi lời nhắn thất bại!'));
      })
      .catch(() => alert('Không kiểm tra được lịch sử gửi lời nhắn!'));
  };

  // Hiện bảng lời nhắn
  document.getElementById('show-msgs-btn').onclick = function() {
    const table = document.getElementById('msg-table');
    const list = document.getElementById('msg-list');
    fetch(SHEET_API)
      .then(res => res.json())
      .then(msgs => {
        list.innerHTML = msgs.length
          ? msgs.map(m => `<tr><td style='padding:6px;'>${m.time || ''}</td><td style='padding:6px;'>${m.nickname || 'Ẩn danh'}</td><td style='padding:6px;'>${m.msg || ''}</td></tr>`).join('')
          : '<tr><td colspan="3">Chưa có lời nhắn nào.</td></tr>';
        table.style.display = table.style.display === 'none' ? 'block' : 'none';
      })
      .catch(() => {
        list.innerHTML = '<tr><td colspan="3">Lỗi khi tải lời nhắn!</td></tr>';
        table.style.display = 'block';
      });
  };
}); 