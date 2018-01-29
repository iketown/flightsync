class FlightResultGroup { // several flight options
	constructor(data, origZone, destZone, origin, destination, color){
		console.log('creating a flightresultgroup with:', data)
		this.rawData = data;
		this.itineraries = this.parseItineraries(data);
		this.orig = origin;
		this.dest = destination;
		this.origZone = origZone;
		this.destZone = destZone;
		this.color = color;
	};
	
	parseItineraries(data){
		let itineraryArray = []
		data.results.forEach(pricePoint => {
			let fare = pricePoint.fare.total_price;
			pricePoint.itineraries.forEach(itinerary=>{
				itinerary.origZone = this.origZone;
				itinerary.destZone = this.destZone;
				itinerary.fare = fare;
				itinerary.duration = this.getTravelTime(itinerary);
				itinerary.minutes = this.getTravelTime(itinerary).asMinutes();;
				itinerary.depTimeLocal = moment(itinerary.outbound.flights[0].departs_at)
				itinerary.arrTimeLocal = moment(itinerary.outbound.flights[itinerary.outbound.flights.length -1].arrives_at)
				itineraryArray.push(itinerary);
			})
		})
		console.log(itineraryArray);
		return itineraryArray;
	};
	getTravelTime(itin){ 
		let startTime = moment.tz(itin.outbound.flights[0].departs_at, this.origZone);
		let endTime = moment.tz(itin.outbound.flights[itin.outbound.flights.length -1].arrives_at, this.destZone);
		let travelTime = endTime.diff(startTime, 'minutes', true); // total time in minutes.
		return moment.duration(travelTime, 'minutes'); // a moment.duration() object
	};

	formatItineraryHTML(itin){
		let html = `
			<div class="flight-result">
				<h3 class="price">$${itin.fare}</h3>`;

				itin.outbound.flights.forEach(leg=> {
					html += `<div class="leg">
						<p class="maininfo">${leg.marketing_airline} #${leg.flight_number} Departs ${leg.origin.airport} ${moment(leg.departs_at).format("ddd MMM D @ h:mma")} | Arrives ${leg.destination.airport} at ${moment(leg.arrives_at).format("h:mma")}</p>
					</div>`
				})
		html += `<div class='travel-time'>total travel time = ${itin.duration.days()} days ${itin.duration.hours()} hr ${itin.duration.minutes()} min</div>`
		html += '</div>';
		return html;
	};
	sortByDuration(arr = this.itineraries){
		return arr.sort((each, others)=>{return each.minutes - others.minutes;});
	}
	sortByPrice(arr = this.itineraries){
		return arr.sort((each, others)=>{return each.fare - others.fare})
	}
	sortByArrivalTimeDelta(targetTime = moment('2018-02-03T13:50'), arr = this.itineraries){
		return arr.sort((each, others)=>{
			let eachDelta = each.arrTimeLocal.diff(targetTime, 'minutes');
			let otherDelta = others.arrTimeLocal.diff(targetTime, 'minutes');
			return Math.abs(eachDelta) - Math.abs(otherDelta);
		});
	}
	
	displayAllItineraries(itineraryArray = this.itineraries, selector = '.rawResults'){
		let itinHTML = itineraryArray.map(itin => this.formatItineraryHTML(itin));
		$(selector).html(itinHTML);
	};
	createDataSet(){
		let dataArray = this.itineraries.map(itin=>{
			return {x: itin.arrTimeLocal, y: itin.fare}
		});
		let dataset = {
			label: this.orig,
			backgroundColor: this.color,
			radius: 5, 
			data: dataArray,
		};
		store.chartDatasets.push(dataset);
	};
	// chartAllItineraries(itins = this.itineraries, by = 'landing'){
	// 	let dataArray = [];
	// 	if (by === 'landing') {
	// 		itins.forEach(each=>{
	// 			dataArray.push({x: each.arrTimeLocal  , y: each.fare  })
	// 		})
	// 	console.log(dataArray)
	// 	createChart(dataArray)
	// 	}
	// }
}

const resultsArray = []; // several groups of flight options