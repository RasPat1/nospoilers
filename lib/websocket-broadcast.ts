export async function broadcastUpdate(data: any) {
  try {
    const wsPort = process.env.WS_PORT || '8081';
    const wsUrl = `http://localhost:${wsPort}/broadcast`;
    
    const response = await fetch(wsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.error('Failed to broadcast update:', response.statusText);
    }
  } catch (error) {
    console.error('Error broadcasting update:', error);
    // Don't throw - we don't want websocket issues to break the main flow
  }
}