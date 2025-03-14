import { Link } from 'react-router-dom'
import { Component } from 'react'
import { CityPresenter, CityPresenterFactory, CityPresenterVM } from '@grenoble-hands-on/web-adapters'

type CityProps = { cityPresenterFactory: CityPresenterFactory, id: string }

export class City extends Component<CityProps, CityPresenterVM> {

    private cityPresenter: CityPresenter

    constructor(public props: CityProps) {
        super(props)
        this.cityPresenter = this.props.cityPresenterFactory.build(this.props.id)
        this.state = this.cityPresenter.vm
    }

    componentDidMount() {
        this.cityPresenter.fetchCity().then()
        this.cityPresenter.fetchWeather().then()

        this.cityPresenter.onVmUpdate((state: CityPresenterVM) => {
            this.setState({ ...state })
        })
    }

    render() {
        const vm = this.state
        return (<section>
                <h1 className="title">Cities weather</h1>
                <article className="panel is-primary">
                    <div className="panel-heading"><h2 aria-label="city name">{vm.city?.name}</h2></div>
                    <div className="panel-block">
                        <div className="control">
                            <label className="radio">
                                <input type="radio" id="select-daily-view"
                                       checked={vm.mode === 'daily'}
                                       onChange={() => this.cityPresenter.updateMode('daily')}
                                       name="mode"/>
                                Simple
                            </label>
                            <label className="radio">
                                <input type="radio" id="select-hourly-view"
                                       checked={vm.mode === 'hourly'}
                                       onChange={() => this.cityPresenter.updateMode('hourly')}
                                       name="mode"/>
                                Detailed
                            </label>
                        </div>
                    </div>
                    <div className="panel-block">
                        <div className="control">
                            <label className="radio">
                                <input type="radio" id="select-celsius-unit"
                                       checked={vm.temperatureUnite === 'C'}
                                       value='C'
                                       onChange={() => this.cityPresenter.updateTemperatureUnite('C')}
                                       name="unit"/>
                                C°
                            </label>
                            <label className="radio">
                                <input type="radio" id="select-fahrenheit-unit"
                                       checked={vm.temperatureUnite === 'F'}
                                       value='F '
                                       onChange={() => this.cityPresenter.updateTemperatureUnite('F')}
                                       name="unit"/>
                                F°
                            </label>
                        </div>
                    </div>
                    {vm.dailyWeather?.length ? (
                        <div className="panel-block">
                            <table id="daily-weather" className="table is-bordered">
                                <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Weather</th>
                                    <th>Max</th>
                                    <th>Min</th>
                                </tr>
                                </thead>
                                <tbody>
                                {vm.dailyWeather.map((weather, i) =>
                                    <tr key={`${i}-${weather.day}`}>
                                        <td>{weather.day}</td>
                                        <td>
                                            <img src={'https://ssl.gstatic.com/onebox/weather/48/' + weather.weather + '.png'}
                                                 alt={weather.weather}/></td>
                                        <td>{weather.temperatureMax + ' ' + weather.unite + '°'}</td>
                                        <td>{weather.temperatureMin + ' ' + weather.unite + '°'}</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    {vm.hourlyWeather?.length ? (
                        <div className="panel-block">
                            <table id="hourly-weather" className="table is-bordered">
                                <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Weather</th>
                                    <th>Temperature</th>
                                </tr>
                                </thead>
                                <tbody>
                                {vm.hourlyWeather.map((weather, i) =>
                                    <tr key={`${i}-${weather.time}`}>
                                        <td>{weather.time}</td>
                                        <td>
                                            <img src={'https://ssl.gstatic.com/onebox/weather/48/' + weather.weather + '.png'}
                                                 alt={weather.weather}/></td>
                                        <td>{weather.temperature + ' ' + weather.unite + '°'}</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    {vm.loading ? <div className="panel-block">Loading...</div> : null}
                    <div className="panel-block">
                        <Link to={'/'} className="button is-rounded">
                            Go back home
                        </Link>
                    </div>
                </article>
            </section>
        )
    }

}
