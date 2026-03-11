// routes/libcal.js

const express = require('express');
const router = express.Router();

/**
 * Get fresh checksum for specific room
 */
/**
 * Get fresh checksum for specific room
 */
async function getChecksumForRoom(libraryId, groupId, roomId, dateStr, startTimeStr, endStr) {
  try {
    console.log(`🔍 Fetching availability for room ${roomId} from ${dateStr} to ${endStr} at ${startTimeStr}...`);
    
    const availResponse = await fetch(
      'https://berkeley.libcal.com/spaces/availability/grid',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://berkeley.libcal.com',
          'Referer': 'https://berkeley.libcal.com/spaces',
        },
        body: new URLSearchParams({
          lid: libraryId,
          gid: groupId,
          eid: roomId,
          seat: '0',
          seatId: '0',
          zone: '0',
          start: dateStr,
          end: endStr,
          pageIndex: '0',
          pageSize: '100',
        }).toString(),
      }
    );

    console.log('📡 Response status:', availResponse.status);
    const contentType = availResponse.headers.get('content-type');
    
    if (!availResponse.ok) {
      const text = await availResponse.text();
      console.error('HTTP Error:', availResponse.status, text);
      return '';
    }

    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON');
      return '';
    }

    const data = await availResponse.json();
    console.log('📡 Slots returned:', data.slots?.length || 0);
    
    if (!data.slots || data.slots.length === 0) {
      console.warn('No slots available');
      return '';
    }

    // Format the requested start time to match slot format
    // Input: "2025-12-15T18:00:00.000Z"
    // Target: "2025-12-15 18:00:00"
    console.log(startTimeStr)
    const startDate = new Date(startTimeStr);
    const targetStart = startTimeStr;
    //  startDate.toISOString()
    //   .replace('T', ' ')
    //   .substring(0, 19); // "YYYY-MM-DD HH:mm:ss"
    
    console.log(`🔍 Looking for slot starting at: ${targetStart}`);

    // Find the slot that matches this exact start time
    const matchingSlot = data.slots.find(slot => {
      return slot.start === targetStart;
    });

    if (matchingSlot) {
      console.log('Found matching slot');
      console.log('Checksum:', matchingSlot.checksum);
      return matchingSlot.checksum;
    }

    // console.warn(` No slot found for ${targetStart}`);
    // console.log('Available slots:');
    // data.slots.forEach(slot => {
    //   console.log(`  - ${slot.start} to ${slot.end} (checksum: ${slot.checksum?.substring(0, 8)}...)`);
    // });

    return '';
  } catch (error) {
    console.error('getChecksumForRoom error:', error.message);
    console.error(error);
    return '';
  }
}

/**
 * POST /api/libcal/book
 */
router.post('/book', async (req, res) => {
  try {
    let { roomId, startTime, duration, libraryId, groupId, userId, checksum } = req.body;

    if (!roomId || !startTime || !libraryId || !groupId) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }
    if(startTime.includes(' - '))
      startTime = startTime.split(' - ')[0]
    console.log(startTime)

    const startDate = new Date(startTime);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const dateStr = startDate.toISOString().split('T')[0]; // "2025-12-15"
    const endStr = endDate.toISOString().split('T')[0];     // "2025-12-18"

    const bookingData = {
      roomId,
      startTime,
      duration: duration || 60,
      libraryId,
      groupId,
      userId,
    };

    console.log('Step 1: Getting checksum for specific time...');
    // const checksum = await getChecksumForRoom(libraryId, groupId, roomId, dateStr, startTime, endStr);
    
    // if (!checksum) {
    //   return res.status(400).json({
    //     error: 'Room not available at requested time',
    //     requestedTime: new Date(startTime).toISOString(),
    //   });
    // }

    console.log(`Checksum obtained`);

    console.log('Step 2: Creating temp booking...');
    const checksumParams = {libraryId, groupId, roomId, dateStr, startTime, endStr}
    console.log('checksum params', checksumParams)
    const { tempBookingId, checksum_ } = await createTempBooking(bookingData, checksum, checksumParams);
    console.log(tempBookingId, checksum_)
    if (!tempBookingId) {
      throw new Error('Failed to get booking ID');
    }

    console.log(`Temp booking ID: ${tempBookingId}`);

    console.log('Step 3: Generating booking URL...');
    
    const bookingUrl = generateBookingUrl(bookingData, tempBookingId, checksum_);

    return res.status(200).json({
      success: true,
      redirectUrl: bookingUrl,
      tempBookingId,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({
      error: 'Booking failed: ' + String(error),
    });
  }
});



/**
 * Create temp booking - checksum is passed in
 */
async function createTempBooking(bookingData, checksum, checksumParams) {
  const startDate = new Date(bookingData.startTime);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);

  const startFormatted = `${startDate.toISOString().split('T')[0]} ${String(startDate.getHours()).padStart(2, '0')}:00`;
  const startDate_only = startDate.toISOString().split('T')[0];
  const endDate_str = endDate.toISOString().split('T')[0];
  // console.log("still valid checksum:",temp)
  const formData = new URLSearchParams();
  formData.append('add[eid]', bookingData.roomId);
  formData.append('add[gid]', bookingData.groupId);
  formData.append('add[lid]', bookingData.libraryId);
  formData.append('add[start]', startFormatted);
  formData.append('add[checksum]', checksum)//await getChecksumForRoom(checksumParams.libraryId, checksumParams.groupId, checksumParams.roomId, checksumParams.dateStr, checksumParams.startTime, checksumParams.endStr));
  formData.append('lid', bookingData.libraryId);
  formData.append('gid', bookingData.groupId);
  formData.append('start', startDate_only);
  formData.append('end', endDate_str);

  console.log('Sending temp booking...', formData);

  try {
    const addResponse = await fetch('https://berkeley.libcal.com/spaces/availability/booking/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://berkeley.libcal.com',
        'Referer': 'https://berkeley.libcal.com/spaces',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: formData.toString(),
    });

    console.log('Response status:', addResponse.status);
    console.log(addResponse)
    if (!addResponse.ok) {
      const text = await addResponse.text();
      console.error('Error response:', text);
      throw new Error(`HTTP ${addResponse.status}: ${text}`);
    }

    const result = await addResponse.json();
    console.log('Temp booking created:', result);

    return {
      tempBookingId: result.bookings[0].id || '',
      checksum: result.bookings[0].checksum || checksum,
    };
  } catch (error) {
    console.error('createTempBooking error:', error);
    throw error;
  }
}

/**
 * Generate booking confirmation URL
 */
function generateBookingUrl(bookingData, tempBookingId, checksum) {
  const startDate = new Date(bookingData.startTime);
  const endDate = new Date(startDate.getTime() + bookingData.duration * 60 * 1000);

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:00`;
  };
  const params = new URLSearchParams({
    'bookings[0][id]': 107141218,
    'bookings[0][eid]': bookingData.roomId,
    'bookings[0][gid]': bookingData.groupId,
    'bookings[0][lid]': bookingData.libraryId,
    'bookings[0][seat_id]': '0',
    'bookings[0][start]': formatDateTime(startDate),
    'bookings[0][end]': formatDateTime(endDate),
    'bookings[0][checksum]': checksum,
    'method': '11',
  });
  const libcal  = `https://berkeley.libcal.com/spaces/auth?${params.toString()}`;
  const casParams = new URLSearchParams({
    'service': libcal,
  });
return libcal
  // const casUrl = `https://auth.berkeley.edu/cas/login?service=https%3A%2F%2Fshib.berkeley.edu%2Fidp%2FAuthn%2FExternal%3Fconversation%3De1s1%26entityId%3Dhttps%3A%2F%2Flibauth.com%2Fsaml%2Fmodule.php%2Fsaml%2Fsp%2Fmetadata.php%2Fspringy-sp&redirect=${encodeURIComponent(libcal)}`;
  return casUrl
}

/**
 * GET /api/libcal/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LibCal API is running' });
});

module.exports = router;
