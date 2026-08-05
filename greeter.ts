export function greet(name: string): string {
  return "Hello, " + name + "!";
}

export function shout(name: string): string {
  return greet(name).toUpperCase();
}

console.log(shout("stream"));
