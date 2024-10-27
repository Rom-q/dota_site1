using System.Text.RegularExpressions;
using RestSharp;
using Newtonsoft.Json;
using System.Net.Http;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

class Program
{
    int choose;
    string ID;
    string wl;
    string match;
    string path = @"D:\da\dotatest\database\";      //path to database
    public static void Main(string[] args)
    {
        Program program = new Program();
        program.Run(args);
    }
    public void Run(string[] args)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
            Directory.CreateDirectory(path + "Match" + @"/");
            Directory.CreateDirectory(path + "Player" + @"/");
        }

        Console.WriteLine("Match or player? 1/2");
        string i = Console.ReadLine();
        if (i == "1")
        {
            choose = 1;
            path = path + "Match" + @"/";
        }
        else if (i == "2")
        {
            choose = 2;
            path = path + "Player" + @"/";
        }
        else 
        Run(args);

        Console.WriteLine("ID:");
        ID = Console.ReadLine();
        if (ID == null)
        Run(args);

        if (!Directory.Exists(path  + ID + @"/"))
        {
            Directory.CreateDirectory(path + ID + @"/");
        }

        if (choose == 1)
        {
            Match();
        }
        else
        {
        Console.WriteLine("winl- winrate \n");
        string command = Console.ReadLine();
        switch (command)
        {
            case "winl":
            Wl();
            break;



            default:
            Console.WriteLine("НЕверно");
            break;
        }
        }
        // var client = new RestClient($"https://api.opendota.com/api/players/{ID}/matches?limit=5&win=1");
        // var request = new RestRequest(Method.GET);
        // IRestResponse response = client.Execute(request);
        // Console.WriteLine(response.Content);
    }
    public void Wl()    //winrate
    {
        var client = new RestClient($"https://api.opendota.com/api/players/{ID}/wl");
        var request = new RestRequest(Method.GET);
        IRestResponse response = client.Execute(request);
        wl += response.Content;
        MatchCollection wltime = Regex.Matches(response.Content,@"\d+");
        int i = int.Parse(wltime[0].Value);
        int j = int.Parse(wltime[1].Value);
        double wr = (double)i / (i + j) * 100;
        wl += "\n" + '"' + "winrate" + '"' + ": " + wr;
        Console.WriteLine(wl);
        string v = "1";
        Write(v);
    }
   public void Match()
{
    var client = new RestClient($"https://api.opendota.com/api/matches/{ID}");
    var request = new RestRequest(Method.GET);
    IRestResponse response = client.Execute(request);
    match += response.Content;
    Console.WriteLine("Match data fetched");
    string v = "0";
    Write(v);
}


    // 0 = Match
    // 1 = wl
    // 2 =
    public void Write(string v)
{
    switch(v)
    {
        case "1":
            if (!File.Exists(path + ID + @"/" + "wl.txt"))
            {
                using(FileStream fs = File.Create(path + ID +  @"\" + "wl.txt")) { }
            }
            string file = File.ReadAllText(path + ID + @"/" + "wl.txt");
            if (file != wl)
            {
                File.AppendAllText(path + ID + @"\" + "wl.txt", wl);
            }
            break;
        case "0":
            if (!File.Exists(path + ID + @"/" + "content.txt"))
            {
                using(FileStream fs = File.Create(path + ID +  @"\" + "content.txt")) { }
            }
            file = File.ReadAllText(path + ID + @"/" + "content.txt");
            if (file != match)
            {
                File.AppendAllText(path + ID + @"\" + "content.txt", match);
            }
            Task.Run(() => ProcessMatchData(file)).Wait();
            break;
    }
    
}
    public void ProcessMatchData(string matchData)
{
    try
    {

        Console.WriteLine("Original Match Data: " + "matchData");

        var parsedObject = JsonConvert.DeserializeObject(matchData);
        Console.WriteLine("JsonConvert Output: " + "parsedObject.ToString()");

        JObject matchInfo = JObject.Parse(matchData);
        Console.WriteLine("Parsed Match Data: " + "matchInfo.ToString()");

        DotaTranslator translator = new DotaTranslator();

        var matchDetails = new JObject
        {
            { "duration", matchInfo["duration"] },
            { "radiant_win", matchInfo["radiant_win"] },
            { "radiant_score", matchInfo["radiant_score"] },
            { "dire_score", matchInfo["dire_score"] },
            { "start_time", matchInfo["start_time"] },
            { "game_mode", matchInfo["game_mode"] },
            { "region", matchInfo["region"] }
        };
        File.WriteAllText(path + ID + @"/" + "match_summary.txt", matchDetails.ToString());

        var players = matchInfo["players"];
        for (int i = 0; i < players.Count(); i++)
        {
            var player = players[i];
            var playerDetails = new JObject
            {
                { "player_slot", player["player_slot"] },
                { "team_number", player["team_number"] },
                { "team_slot", player["team_slot"] },
                { "hero_id", translator.GetHeroName((int)player["hero_id"]) },
                { "hero_variant", player["hero_variant"] },
                { "kills", player["kills"] },
                { "deaths", player["deaths"] },
                { "assists", player["assists"] },
                { "last_hits", player["last_hits"] },
                { "denies", player["denies"] },
                { "gold_per_min", player["gold_per_min"] },
                { "xp_per_min", player["xp_per_min"] },
                { "level", player["level"] },
                { "net_worth", player["net_worth"] },
                { "hero_damage", player["hero_damage"] },
                { "tower_damage", player["tower_damage"] },
                { "hero_healing", player["hero_healing"] },
                { "item_0", translator.GetItemName((int)player["item_0"]) },
                { "item_1", translator.GetItemName((int)player["item_1"]) },
                { "item_2", translator.GetItemName((int)player["item_2"]) },
                { "item_3", translator.GetItemName((int)player["item_3"]) },
                { "item_4", translator.GetItemName((int)player["item_4"]) },
                { "item_5", translator.GetItemName((int)player["item_5"]) },
                { "backpack_0", translator.GetItemName((int)player["backpack_0"]) },
                { "backpack_1", translator.GetItemName((int)player["backpack_1"]) },
                { "backpack_2", translator.GetItemName((int)player["backpack_2"]) },
                { "item_neutral", translator.GetItemName((int)player["item_neutral"]) }
            };

            Console.WriteLine($"Player {i + 1} Data: " + playerDetails.ToString());

            File.WriteAllText(path + ID + @"/" + $"player_{i + 1}.txt", playerDetails.ToString());
        }
        Console.WriteLine("Вся информация о матче успешно разбита на файлы .txt");
    }
    catch (JsonReaderException e)
    {
        Console.WriteLine($"Ошибка чтения JSON: {e.Message}");
        Console.WriteLine("Исходные данные: " + "matchData" + "2");
    }
    catch (Exception e)
    {
        Console.WriteLine($"Неизвестная ошибка: {e.Message}");
        Console.WriteLine("Исходные данные: " + "matchData" + "1");
    }
}


public class DotaTranslator
{
    private Dictionary<int, string> heroes;
    private Dictionary<int, string> items;
    private Dictionary<int, string> abilities;

    public DotaTranslator()
    {
        heroes = GetConstants("heroes");
        items = GetConstants("items");
        abilities = GetConstants("abilities");
    }

    private Dictionary<int, string> GetConstants(string type)
    {
        var client = new HttpClient();
        var response = client.GetStringAsync($"https://api.opendota.com/api/constants/{type}").Result;
        var json = JObject.Parse(response);
        var constants = new Dictionary<int, string>();

        foreach (var item in json)
        {
            if (item.Value["id"] != null && item.Value["localized_name"] != null)
            {
                constants.Add((int)item.Value["id"], (string)item.Value["localized_name"]);
            }
        }
        return constants;
    }

    public string GetHeroName(int id)
    {
        return heroes.ContainsKey(id) ? heroes[id] : "Unknown Hero";
    }

    public string GetItemName(int id)
    {
        return items.ContainsKey(id) ? items[id] : "Unknown Item";
    }

    public string GetAbilityName(int id)
    {
        return abilities.ContainsKey(id) ? abilities[id] : "Unknown Ability";
    }

    public bool ItemExists(int id)
    {
        return items.ContainsKey(id);
    }
}
}









