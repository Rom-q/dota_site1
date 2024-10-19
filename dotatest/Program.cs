using System.Text.RegularExpressions;
using RestSharp;


class Program
{
    string ID;
    string wl;
    string path = @"D:\da\dotatest\database\";      //path to database
    public static void Main(string[] args)
    {
        Program program = new Program();
        program.Run(args);
    }
    public void Run(string[] args)
    {
        Console.WriteLine("ID:");
        ID = Console.ReadLine();
        if (!Directory.Exists(path  + ID))
        {
            Directory.CreateDirectory(path + ID);
        }
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
    // 1 = wl
    // 2 =
    public void Write(string v)     //database
    {
        switch(v)
        {
            case "1":
            {
                if(!File.Exists(path + ID + "wl.txt"))
                {
                    using(FileStream fs = File.Create(path + ID +  @"\" + "wl.txt"))
                    {
                        
                    }
                }
                string file = File.ReadAllText(path + ID + "wl.txt");
                if(file != wl)
                {
                File.AppendAllText(path + ID + @"\" + "wl.txt", wl );
                }
            }
            break;
        }
    }
}


