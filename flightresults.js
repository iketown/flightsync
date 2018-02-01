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
		this.prices = this.doPriceRange();
		this.times = this.doTravelTimes();
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
	doPriceRange(){
		let pricesArr = this.itineraries.map(itin=>{
			return itin.fare
		});
		pricesArr.sort((p,e) =>  p-e);
		let all = pricesArr;
		let low = pricesArr[0]
		let high = pricesArr[pricesArr.length -1]
		let med = pricesArr[Math.floor(pricesArr.length/2)]
		store.prices.push(...all)
		store.prices.sort((p,o) => p-o )
		return {
			all, low, high, med
		}

	};
	doTravelTimes(){
		let timesArr = this.itineraries.map(itin=>{
			return itin.duration._milliseconds
		})
		timesArr.sort((t,e)=> t-e)
		// console.log('trav times', timesArr)
		return {
			all: timesArr,
			low: timesArr[0],
			high: timesArr[timesArr.length -1],
			med: timesArr[Math.floor(timesArr.length/2)]
		}
	}
	displayAllItineraries(itineraryArray = this.itineraries, selector = '.rawResults'){
		let itinHTML = itineraryArray.map(itin => this.formatItineraryHTML(itin));
		$(selector).html(itinHTML);
	};
	getR(itin, maxSize, minSize){
			// if this is the biggest, it would be 1.
			// any other number is a fraction of the biggest.  (a .25 of 1)
			let percentage = itin.duration._milliseconds / this.times.high
			return (maxSize-4) * percentage + minSize;
	};
	createDataSets(){
			let maxSize = 10;
			let minSize = 3;
			// let range = maxSize - minSize;

		let dataArray = this.itineraries.map(itin=>{
			return {x: itin.arrTimeLocal, y: Number(itin.fare), r: this.getR(itin, maxSize, minSize)}
		});

		//'latest' is some time in 1969, so its easy to beat when we start comparing.
		//earliest is far far in the future same reason.
		let timeset = this.itineraries.map(itin=>{
			return itin.arrTimeLocal
		})

		// put them in order from earliest to latest
		timeset.sort((e,o)=> e - o)

		// set the earliest and latest of all itineraries
		let latest = moment().subtract(100, 'years');
		let earliest = moment().add(100, 'years');
		if (timeset[0] < earliest) {
			earliest = timeset[0];
			console.log('earliest reset to', earliest);
		};
		if (timeset[timeset.length - 1] > latest){
			latest = timeset[timeset.length-1]
			console.log('latest reset to', latest);
		};

		dataArray.sort(function(e,o){ return e.y - o.y }) // put them in order of price.
		let dataset = {
			label: this.orig,
			backgroundColor: this.color,
			// radius: 10, 
			data: dataArray,
		};
		store.timeBounds = {latest, earliest}
		store.chartDatasets.push(dataset);
		store.chartTimesets.push(timeset);
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