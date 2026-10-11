function formatDate(date){
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`
}

// lid needs to be a number
async function getLibraryBookings(startDate,endDate,lid){
    if(!lid){
        console.error("No library id given for getLibraryBookings")
        return
    }

    if(isNaN(Number(lid))){
        console.error("lid is not a number in getLibraryBookings")
        return
    }
    const startDateFormatted = formatDate(startDate);
    const endDateFormatted = formatDate(endDate);
    
    const postParams = new URLSearchParams();
    postParams.append("lid",Number(lid));
    postParams.append("gid","0");
    postParams.append("eid","-1");
    postParams.append("seat","0");
    postParams.append("seatId","0");
    postParams.append("zone","0");
    postParams.append("start",startDateFormatted);
    postParams.append("end",endDateFormatted);
    postParams.append("pageIndex","0");
    postParams.append("pageSize","18");
    
    try {
        const response = await fetch('https://berkeley.libcal.com/spaces/availability/grid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                "Origin"      : "https://berkeley.libcal.com",
                "Referer"     : "https://berkeley.libcal.com/reserve/gardner"
            },
            body:postParams
        });

        const data = await response.json();
        return data.slots
    } catch (error) {
        console.error('Error fetching libcal bookings data:', error);
    }
}


async function getLibraryIds(){
    let libraries=[]
    const response = await fetch('https://berkeley.libcal.com/reserve/EART');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('#lid').find("option").each((_,element)=>{
        $el=$(element);
        if($el.attr("value")!=0){
            libraries.push({"name":$el.text(),"lid":$el.attr("value")})
            // console.log(`${$el.text()} : ${$el.attr("value")}`)
        }
    })
    return libraries
}


async function getRoomIds(bookings){
    
    let roomIds=[];
    for(const booking of bookings){
        if(!roomIds.includes(booking.itemId)){
            roomIds.push(booking.itemId)
        }
    }
    let roomIdToName=[];
    for(const id of roomIds){
        const response = await fetch(`https://berkeley.libcal.com/space/${id}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        roomIdToName.push({"name":$('#s-lc-public-header-title')
                        .clone()
                        .children()
                        .remove()
                        .end()
                        .text()
                        .trim(),
                        "roomId":id
                    })
    }
    
    return roomIdToName
}

/* Return bookings and roomIds in the form of 
{
    bookings:[{
            start: '2026-04-05 16:00:00',
            end: '2026-04-05 17:00:00',
            itemId: 62854,
            checksum: '569f988f4c62db75d25def93383b7326'
            },...]
    roomIds: [ { name: 'Room B4, Level B', roomId: 62852 },...]
}*/
async function getRoomIdsAndLibIds(startDate,endDate,lid){
    const bookings=await getLibraryBookings(startDate,endDate,lid)
    const roomIds=await getRoomIds(bookings)
    return {
        "bookings": bookings,
        "roomIds":roomIds
    }

}

module.exports = { getLibraryBookings, getLibraryIds ,getRoomIdsAndLibIds};