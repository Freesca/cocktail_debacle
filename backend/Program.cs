using backend.Data;
using backend.Entities;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",  // Nome della policy CORS
        policy =>
        {
            policy.WithOrigins("http://localhost")  // L'indirizzo del tuo frontend Angular
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();  // Aggiungi questa riga per permettere l'invio di credenziali (cookie)
        });
});


// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpClient(); // Per HttpClient injection


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<User, Role>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
})
.AddJwtBearer("JwtBearer", options =>
{
    var jwtConfig = builder.Configuration.GetSection("Jwt");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtConfig["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtConfig["Audience"],
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtConfig["Key"]!)
        )
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Se l'Authorization header non esiste, prova a leggere dal cookie "jwt"
            if (context.Request.Cookies.ContainsKey("jwt"))
            {
                context.Token = context.Request.Cookies["jwt"];
            }
            return Task.CompletedTask;
        }
    };
})
.AddGoogle(googleOptions =>
{
    var clientId = builder.Configuration["Authentication:Google:ClientId"];
    var clientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

    if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
    {
        throw new Exception("Google ClientId or ClientSecret is missing from configuration.");
    }

    googleOptions.ClientId = clientId;
    googleOptions.ClientSecret = clientSecret;
    googleOptions.CallbackPath = "/signin-google"; 
});

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<UserNameService>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // db.Database.EnsureDeleted();
    db.Database.Migrate();

    // ✅ IMPORT AUTOMATICO cocktail
    var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var filePath = Path.Combine(env.WebRootPath ?? "wwwroot", "data", "cocktails.json");
    
    if (File.Exists(filePath))
    {
        var json = await File.ReadAllTextAsync(filePath);
        var jsonDoc = JsonDocument.Parse(json);
        var drinks = jsonDoc.RootElement.GetProperty("drinks");

        var cocktails = JsonSerializer.Deserialize<List<Cocktails>>(drinks.GetRawText());
        if (cocktails != null && !db.Cocktails.Any())
        {
            db.Cocktails.AddRange(cocktails);
            await db.SaveChangesAsync();
        }
    }
}


app.UseStaticFiles(); // Serve i file da wwwroot

app.UseCors("AllowLocalhost");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
