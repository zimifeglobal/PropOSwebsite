/**
 * Real city names for address forms (UK + Nigeria), deduped and sorted.
 * Sourced from official city/town lists; expand as needed.
 */
(function () {
  const uk = [
    'Aberdeen', 'Aberystwyth', 'Bangor', 'Bath', 'Belfast', 'Birmingham', 'Blackburn', 'Blackpool',
    'Bolton', 'Bournemouth', 'Bradford', 'Brighton', 'Bristol', 'Burnley', 'Cambridge', 'Canterbury',
    'Cardiff', 'Carlisle', 'Chelmsford', 'Cheltenham', 'Chester', 'Chichester', 'Colchester', 'Coventry',
    'Crawley', 'Derby', 'Doncaster', 'Dundee', 'Durham', 'Eastbourne', 'Edinburgh', 'Exeter',
    'Glasgow', 'Gloucester', 'Grimsby', 'Guildford', 'Halifax', 'Hastings', 'Hereford', 'High Wycombe',
    'Huddersfield', 'Hull', 'Inverness', 'Ipswich', 'Kingston upon Hull', 'Lancaster', 'Leeds', 'Leicester',
    'Lincoln', 'Lisburn', 'Liverpool', 'London', 'Luton', 'Manchester', 'Mansfield', 'Middlesbrough',
    'Milton Keynes', 'Newcastle upon Tyne', 'Newport', 'Newry', 'Northampton', 'Norwich', 'Nottingham',
    'Oxford', 'Peterborough', 'Plymouth', 'Portsmouth', 'Preston', 'Reading', 'Ripon', 'Salford',
    'Salisbury', 'Sheffield', 'Southampton', 'Southend-on-Sea', 'St Albans', 'Stoke-on-Trent', 'Sunderland',
    'Swansea', 'Swindon', 'Truro', 'Wakefield', 'Warrington', 'Wells', 'Westminster', 'Wigan',
    'Winchester', 'Wolverhampton', 'Worcester', 'Worthing', 'York',
  ];
  const ng = [
    'Aba', 'Abeokuta', 'Abuja', 'Ado Ekiti', 'Agege', 'Akure', 'Asaba', 'Awka', 'Bauchi', 'Benin City',
    'Birnin Kebbi', 'Calabar', 'Damaturu', 'Dutse', 'Eket', 'Enugu', 'Festac Town', 'Gombe', 'Gusau',
    'Ibadan', 'Ife', 'Ikeja', 'Ikorodu', 'Ikot Ekpene', 'Ilorin', 'Ijebu Ode', 'Ikoyi', 'Jalingo', 'Jos',
    'Kaduna', 'Kano', 'Katsina', 'Lafia', 'Lagos', 'Lekki', 'Maiduguri', 'Makurdi', 'Minna', 'Mushin',
    'Nsukka', 'Ogbomoso', 'Ondo', 'Onitsha', 'Orlu', 'Osogbo', 'Owerri', 'Oyo', 'Port Harcourt',
    'Sagamu', 'Sokoto', 'Suleja', 'Umuahia', 'Uyo', 'Victoria Island', 'Warri', 'Yenagoa', 'Yola', 'Zaria',
  ];
  const set = new Set([...uk, ...ng]);
  window.PROPOS_ADDRESS_CITIES = Array.from(set).sort((a, b) => a.localeCompare(b, 'en'));
})();
